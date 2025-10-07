import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';

import { ChatBubbleOutline, Height } from '@mui/icons-material';
import { Alert, Box, Button, Stack, TextField, styled } from '@mui/material';

import { Api, TokenContext, useLocalContext } from '@graasp/apps-query-client';
import { PyWorker, PyodideStatus } from '@graasp/pyodide';
import { ChatbotRole } from '@graasp/sdk';
import { useFullscreen } from '@graasp/ui/apps';

import { CHAT_BOT_ERROR_MESSAGE, INSTRUCTOR_CODE_ID } from '@/config/constants';
import { PYTHON } from '@/config/programmingLanguages';

import { APP_ACTIONS_TYPES } from '../../config/appActionsTypes';
import { APP_DATA_TYPES } from '../../config/appDataTypes';
import {
  CODE_EXECUTION_SETTINGS_NAME,
  DATA_FILE_LIST_SETTINGS_NAME,
} from '../../config/appSettingsTypes';
import { mutations } from '../../config/queryClient';
import {
  CHATBOT_PROMPT_CONTAINER_CY,
  REPL_CONTAINER_CY,
  REPL_EDITOR_ID_CY,
  SETTING_CHATBOT_INITIAL_PROMPT_DISPLAY_CY,
} from '../../config/selectors';
import {
  DEFAULT_CODE_EXECUTION_SETTINGS,
  DEFAULT_DATA_FILE_LIST_SETTINGS,
} from '../../config/settings';
import { CodeVersionType } from '../../interfaces/codeVersions';
import {
  CodeExecutionSettingsKeys,
  DataFileListSettingsKeys,
} from '../../interfaces/settings';
import { sortAppDataFromNewest } from '../../utils/utils';
import ChatbotAvatar from '../chatbot/ChatbotAvatar';
import ChatbotPrompts from '../chatbot/ChatbotPrompts';
import CodeReview from '../codeReview/CodeReview';
import { useAppDataContext } from '../context/AppDataContext';
import { ReviewProvider } from '../context/ReviewContext';
import { useSettings } from '../context/SettingsContext';
import CodeEditor from './CodeEditor';
import NoobInput from './NoobInput';
import OutputConsole from './OutputConsole';
import ReplToolbar from './ReplToolbar';
import ShowFigures from './ShowFigures';

const OutlineWrapper = styled(Box)(({ theme }) =>
  theme.unstable_sx({
    height: 'auto',
    border: 1,
    borderColor: 'info.main',
    borderRadius: 1,
    // overflow: 'hidden',
  }),
);

type Props = {
  seedValue: CodeVersionType;
  // todo: implement "bo-back" button
  // eslint-disable-next-line react/no-unused-prop-types
  onClose: () => void;
};

const Repl = ({ seedValue }: Props): JSX.Element => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: postChatBot } = mutations.usePostChatBot();
  const { postAppDataAsync, comments } = useAppDataContext();
  const [worker, setWorker] = useState<PyWorker | null>(null);
  const [output, setOutput] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [figures, setFigures] = useState<string[]>([]);
  const [dataFiles, setDataFiles] = useState<
    { filePath: string; fileText: string }[]
  >([]);
  const [dataFilesReady, setDataFilesReady] = useState(false);
  const [reloadDataFiles, setReloadDataFiles] = useState(true);
  const context = useLocalContext();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const token = useContext(TokenContext);
  const apiHost = context?.apiHost;

  const { mutate: postAction } = mutations.usePostAppAction();

  const { liveCode, postAppData } = useAppDataContext();
  // sort app data by the latest to the oldest
  const sortedCodeVersions = sortAppDataFromNewest(liveCode);
  const latestCode = sortedCodeVersions[0]?.data?.code;
  const currentCode = latestCode || (seedValue ? seedValue.code : '');
  const [value, setValue] = useState(currentCode);
  useEffect(() => {
    setValue(currentCode);
  }, [currentCode]);
  const savedStatus = value === currentCode;
  const {
    [CODE_EXECUTION_SETTINGS_NAME]:
      codeExecSettings = DEFAULT_CODE_EXECUTION_SETTINGS,
    [DATA_FILE_LIST_SETTINGS_NAME]:
      dataFileListSetting = DEFAULT_DATA_FILE_LIST_SETTINGS,
    dataFileSettings,
  } = useSettings();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [replStatus, setReplStatus] = useState<PyodideStatus>(
    PyodideStatus.LOADING_PYODIDE,
  );

  // register worker on mount
  useEffect(
    () => {
      if (codeExecSettings) {
        const workerInstance = new PyWorker(
          'https://spaenleh.github.io/graasp-pyodide/fullWorker.min.js',
        );
        const preLoadedPackages = codeExecSettings[
          CodeExecutionSettingsKeys.PreLoadedLibraries
        ]
          .split(' ')
          // remove empty strings
          .filter(Boolean);
        if (preLoadedPackages) {
          workerInstance.preLoadedPackages = preLoadedPackages;
        }

        workerInstance.onOutput = (newOutput: string, append = false) => {
          setOutput((prevOutput) =>
            append ? `${prevOutput}${newOutput}` : newOutput,
          );
        };

        workerInstance.onInput = (newPrompt: string) => {
          setIsWaitingForInput(true);
          setPrompt(newPrompt);
        };

        // todo: improve type of function to be able to remove the ts error
        // @ts-ignore
        workerInstance.onError = (newError: { data: string }) => {
          setError(newError.data);
        };

        workerInstance.onTerminated = () => {
          setIsExecuting(false);
          setReplStatus(PyodideStatus.READY);
        };

        workerInstance.onFigure = (figureData) => {
          setFigures((prevFigures) => [...prevFigures, figureData]);
          postAction({
            type: APP_ACTIONS_TYPES.NEW_FIGURE,
            data: { figure: figureData },
          });
        };

        workerInstance.onStatusUpdate = (status: PyodideStatus) => {
          setReplStatus(status);
        };

        // preload worker instance
        workerInstance.preload();

        setWorker(workerInstance);
        postAction({
          type: APP_ACTIONS_TYPES.INITIALIZE_EXECUTION,
          data: {},
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeExecSettings],
  );

  // load files when settings are loaded
  useEffect(() => {
    const callback = async (): Promise<void> => {
      if (
        dataFileListSetting[DataFileListSettingsKeys.Files].length &&
        dataFileSettings.length > 0 &&
        apiHost &&
        token
      ) {
        const myPromises = dataFileSettings.map(async (f) => {
          const appSettingId = f.id;
          // eslint-disable-next-line no-console
          console.log(`loading data file (id: ${appSettingId})`);
          // find file attributes in the data list setting
          const fileAttributes = dataFileListSetting[
            DataFileListSettingsKeys.Files
          ].find((file) => file.appSettingId === appSettingId);
          // if file attributes were found, load file content
          if (fileAttributes) {
            // todo: add caching
            const fileBlob = await Api.getAppSettingFileContent({
              id: appSettingId,
              apiHost,
              token,
            });
            const fileText = await fileBlob.text();
            const filePath = fileAttributes.virtualPath;
            return { filePath, fileText };
          }
          return null;
        });
        const result = (await Promise.all(myPromises)).filter(Boolean) as {
          filePath: string;
          fileText: string;
        }[];
        setDataFiles(result);
        setDataFilesReady(true);
      }
    };
    callback();
  }, [dataFileListSetting, dataFileSettings, apiHost, token]);

  // load data files when worker is set or reload is requested
  useEffect(
    () => {
      if (worker && dataFilesReady && reloadDataFiles) {
        // eslint-disable-next-line no-console
        console.log('loading data files into worker filesystem');
        dataFiles.forEach((f) => worker.putFile(f.filePath, f.fileText));
        setReloadDataFiles(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worker, dataFilesReady, reloadDataFiles],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const footerCode = codeExecSettings[CodeExecutionSettingsKeys.FooterCode];
      const fullCode = `${value}\n${footerCode}`;
      console.log('scrolled');
      const prompt = [
        {
          role: ChatbotRole.System,
          content: `What do you think about this code? If you think the code is working, answer only with "no" ${fullCode}`,
        },
      ];
      const actionData = {
        line: 0,
        parent: null,
        codeId: INSTRUCTOR_CODE_ID,
        content: CHAT_BOT_ERROR_MESSAGE,
      };
      postChatBot(prompt).then(async (chatBotRes) => {
        postAction({
          data: chatBotRes,
          type: APP_ACTIONS_TYPES.BOT_RUNFEEDBACK,
        });
        if (chatBotRes.completion.toLowerCase() !== 'no') {
          actionData.content = chatBotRes.completion;
          await postAppDataAsync({
            data: actionData,
            type: APP_DATA_TYPES.BOT_COMMENT,
          });
          postAction({
            data: actionData,
            type: APP_ACTIONS_TYPES.CREATE_COMMENT,
          });
        }
        messageContainerRef.current?.scrollTo({
          top: messageContainerRef.current?.scrollHeight,
        });
      });
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // const onClickRunCode = (): void => {
  //   // to run the code:
  //   // - previous run must be done
  //   // - worker must be set
  //   // - value must be true
  //   if (!isExecuting && worker) {
  //     const headerCode = codeExecSettings[CodeExecutionSettingsKeys.HeaderCode];
  //     const footerCode = codeExecSettings[CodeExecutionSettingsKeys.FooterCode];
  //     const fullCode = `${headerCode}\n${value}\n${footerCode}`;
  //     if (fullCode.trim()) {
  //       setIsExecuting(true);
  //       // reset output
  //       worker.clearOutput();
  //       setOutput('');
  //       worker.run(fullCode);
  //       // post that code was run
  //       postAction({ type: APP_ACTIONS_TYPES.RUN_CODE, data: { code: value } });
  //     }
  //   }
  // };

  const onClickMaxiRunCode = (): void => {
    // to run the code:
    // - previous run must be done
    // - worker must be set
    // - value must be true
    if (!isExecuting && worker) {
      const headerCode = codeExecSettings[CodeExecutionSettingsKeys.HeaderCode];
      const footerCode = codeExecSettings[CodeExecutionSettingsKeys.FooterCode];
      const fullCode = `${headerCode}\n${value}\n${footerCode}`;
      if (fullCode.trim()) {
        setIsExecuting(true);
        // reset output
        worker.clearOutput();
        setOutput('');
        // ADD CHATBOT PROMPTING HERE
        worker.run(fullCode);
        // post that code was run
        const prompt = [
          {
            role: ChatbotRole.System,
            content: `What do you think about the code? If you think the code is working, answer only with "no" ${fullCode}`,
          },
        ];
        const actionData = {
          line: 0,
          parent: null,
          codeId: INSTRUCTOR_CODE_ID,
          content: CHAT_BOT_ERROR_MESSAGE,
        };
        postChatBot(prompt).then((chatBotRes) => {
          postAction({
            data: chatBotRes,
            type: APP_ACTIONS_TYPES.BOT_RUNFEEDBACK,
          });
          if (chatBotRes.completion.toLowerCase() !== 'no') {
            actionData.content = chatBotRes.completion;
            postAppDataAsync({
              data: actionData,
              type: APP_DATA_TYPES.BOT_COMMENT,
            });
            postAction({
              data: actionData,
              type: APP_ACTIONS_TYPES.CREATE_COMMENT,
            });
          }
        });
      }
    }
  };

  const onClickClearOutput = (): void => {
    worker?.stop();
    worker?.create();
    // reload files in worker filesystem
    setReloadDataFiles(true);
    setOutput('');
    setFigures([]);
    worker?.clearOutput();
    // post that the console was cleared
    postAction({ type: APP_ACTIONS_TYPES.CLEAR_OUTPUT, data: {} });
  };

  const onClickStopCode = (): void => {
    if (isWaitingForInput && worker) {
      worker.cancelInput();
      worker.stop();
      setIsWaitingForInput(false);
      postAction({
        type: APP_ACTIONS_TYPES.STOP_EXECUTION_DURING_PROMPT,
        data: { prompt },
      });
    }
    if (isExecuting && worker) {
      worker.stop();
      setIsExecuting(false);
      postAction({
        type: APP_ACTIONS_TYPES.STOP_EXECUTION,
        data: { code: value },
      });
    }
  };

  const onClickValidateInput = (userInput: string): void => {
    if (worker) {
      worker.submitInput(userInput);
      setIsWaitingForInput(false);
      postAction({
        type: APP_ACTIONS_TYPES.SUBMITTED_INPUT,
        data: { input: userInput },
      });
    }
  };

  const onClickCancel = (userInput: string): void => {
    if (worker) {
      worker.cancelInput();
      setIsWaitingForInput(false);
      postAction({
        type: APP_ACTIONS_TYPES.CANCEL_PROMPT,
        data: { input: userInput },
      });
    }
  };

  const onClickSaveCode = (): void => {
    // creates a new app data each time the user saves
    postAppData({ data: { code: value }, type: APP_DATA_TYPES.LIVE_CODE });
    postAction({
      type: APP_ACTIONS_TYPES.SAVE_CODE,
      data: { code: value },
    });
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // run code using CTRL + ENTER
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      (document.activeElement as HTMLDivElement)?.blur();
      onClickMaxiRunCode();
    }

    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      onClickSaveCode();
    }
  };

  return (
    <Stack
      display="flex"
      direction="row"
      height={isFullscreen ? '100vh' : '650px'}
      data-cy={REPL_CONTAINER_CY}
      spacing={1}
      p={2}
    >
      <Stack flex={1} direction="column" spacing={1} overflow="hidden">
        <ReplToolbar
          savedStatus={savedStatus}
          // onRunCode={onClickRunCode}
          onMaxiRunCode={onClickMaxiRunCode}
          onStopCode={onClickStopCode}
          onClearOutput={onClickClearOutput}
          onSaveCode={onClickSaveCode}
          onFullscreen={toggleFullscreen}
          status={replStatus}
          isFullscreen={isFullscreen}
        />
        <Stack flex={1} direction="column" spacing={1} overflow="hidden">
          <OutlineWrapper
            flex={2}
            overflow="hidden"
            onKeyDown={handleEditorKeyDown}
            minHeight="350px"
          >
            <CodeEditor
              id={REPL_EDITOR_ID_CY}
              value={value}
              setValue={setValue}
              languageSupport={[PYTHON]}
            />
          </OutlineWrapper>
          <Stack
            display="flex"
            flex={1}
            direction="column"
            spacing={1}
            overflow="hidden"
          >
            <OutlineWrapper display="flex" flex={1} p={1}>
              <OutputConsole output={output} />
              <NoobInput
                prompt={prompt}
                isWaitingForInput={isWaitingForInput}
                onValidate={onClickValidateInput}
                onCancel={onClickCancel}
              />
            </OutlineWrapper>
          </Stack>
          {error && <Alert color="error">{error}</Alert>}
        </Stack>
      </Stack>
      <Stack
        ref={messageContainerRef}
        direction="row"
        width={isFullscreen ? '100vh' : '400px'}
        overflow="auto"
      >
        <CodeReview code={value} />
      </Stack>
      {/* <Stack>
      <Button code={value} onSend="">LALALA</Button>
      </Stack> */}
    </Stack>
  );
};

export default Repl;
