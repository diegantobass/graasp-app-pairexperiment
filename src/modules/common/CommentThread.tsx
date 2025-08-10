import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, CircularProgress, Stack, Typography } from '@mui/material';

import { ChatbotThreadMessage, buildPrompt } from '@graasp/apps-query-client';

import { buildThread } from '@/utils/comments';

import { APP_ACTIONS_TYPES } from '../../config/appActionsTypes';
import { APP_DATA_TYPES } from '../../config/appDataTypes';
import {
  CHATBOT_PROMPT_SETTINGS_NAME,
  GENERAL_SETTINGS_NAME,
} from '../../config/appSettingsTypes';
import {
  CHAT_BOT_ERROR_MESSAGE,
  DEFAULT_CHATBOT_PROMPT_APP_DATA,
} from '../../config/constants';
import { hooks, mutations } from '../../config/queryClient';
import { COMMENT_THREAD_CONTAINER_CYPRESS } from '../../config/selectors';
import { DEFAULT_GENERAL_SETTINGS } from '../../config/settings';
import { CommentType } from '../../interfaces/comment';
import {
  ChatbotPromptSettings,
  GeneralSettingsKeys,
} from '../../interfaces/settings';
import { useAppDataContext } from '../context/AppDataContext';
import { CommentProvider } from '../context/CommentContext';
import { useReviewContext } from '../context/ReviewContext';
import { useSettings } from '../context/SettingsContext';
import CommentContainer from '../layout/CommentContainer';
import ResponseContainer from '../layout/ResponseContainer';
import Comment from './Comment';
import CommentEditor from './CommentEditor';
import ResponseBox from './ResponseBox';
import { useCodeContext } from '../context/CodeProvider';

type Props = {
  children?: CommentType[];
  hiddenState: boolean;
};

const CommentThread = ({
  children,
  hiddenState,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const {
    addResponse,
    currentRepliedCommentId,
    currentEditedCommentId,
    closeComment,
    closeEditingComment,
  } = useReviewContext();
  const { patchAppData, postAppDataAsync } = useAppDataContext();
  const { code } = useCodeContext();
  const { mutate: postAction } = mutations.usePostAppAction();
  const {
    [GENERAL_SETTINGS_NAME]: generalSettings = DEFAULT_GENERAL_SETTINGS,
  } = useSettings();
  const { data: chatbotPrompts } = hooks.useAppSettings<ChatbotPromptSettings>({
    name: CHATBOT_PROMPT_SETTINGS_NAME,
  });
  const maxThreadLength = generalSettings[GeneralSettingsKeys.MaxThreadLength];

  const { mutateAsync: postChatBot, isLoading } = mutations.usePostChatBot();

  const isEdited = (id: string): boolean => id === currentEditedCommentId;
  const isReplied = (id: string): boolean => id === currentRepliedCommentId;
  const allowedChatbotResponse = (
    arr: CommentType[],
    idx: number,
    commentType: string,
  ): boolean =>
    (arr.length < maxThreadLength &&
      commentType === APP_DATA_TYPES.BOT_COMMENT) ||
    // when the comment is a user comment it should not be a response to a chatbot comment
    // -> in this case, we want to wait for the chatbot response
    (commentType === APP_DATA_TYPES.COMMENT &&
      arr[idx - 1]?.type !== APP_DATA_TYPES.BOT_COMMENT) ||
    // allow to respond if it is a teacher comment
    commentType === APP_DATA_TYPES.TEACHER_COMMENT;

  if (!children || children?.length === 0 || hiddenState) {
    return null;
  }

  const threads = children
    .filter((c) => !c.data.parent)
    .map((parent) => buildThread(parent, children))
    .map((thread) => thread.slice()) // Create a shallow copy of each thread
    .sort((threadA, threadB) => {
      const createdAtA = new Date(threadA[0]?.createdAt || 0).getTime();
      const createdAtB = new Date(threadB[0]?.createdAt || 0).getTime();

      return createdAtA - createdAtB;
    });

  const copyWithEmptyContent = (c: CommentType): CommentType => {
    const newComment = JSON.parse(JSON.stringify(c)) as CommentType;
    newComment.data.content = '';
    return newComment;
  };

  if (chatbotPrompts) {
    return (
      <>
        {threads.map((thread) => (
          <CommentContainer
            data-cy={COMMENT_THREAD_CONTAINER_CYPRESS}
            key={`comment-thread-${thread[0]?.id}`}
          >
            {thread.map((c, i, arr) => (
              <Fragment key={c.id}>
                <CommentProvider value={c}>
                  {isEdited(c.id) ? (
                    <CommentEditor
                      maxTextLength={
                        generalSettings[GeneralSettingsKeys.MaxCommentLength]
                      }
                      onCancel={() => {
                        closeEditingComment();
                      }}
                      onSend={(content) => {
                        patchAppData({
                          id: c.id,
                          data: {
                            ...c.data,
                            content,
                          },
                        });
                        closeEditingComment();
                      }}
                      comment={c}
                    />
                  ) : (
                    <Comment comment={c} />
                  )}
                </CommentProvider>
                {
                  // show input bar to respond to comment
                  i + 1 === arr.length &&
                    !isLoading &&
                    !isEdited(c.id) &&
                    !isReplied(c.id) &&
                    allowedChatbotResponse(arr, i, c.type) && (
                      <ResponseBox commentId={c.id} onClick={addResponse} />
                    )
                }
                {i + 1 === arr.length && isLoading && (
                  <ResponseContainer>
                    <Stack spacing={2} direction="row" justifyContent="center">
                      <Typography color="#666">{t('Loading')}</Typography>
                      <CircularProgress sx={{ color: '#666' }} size="20px" />
                    </Stack>
                  </ResponseContainer>
                )}
                {
                  // if input bar was clicked, a comment editor opens to compose a response
                  isReplied(c.id) && (
                    <CommentEditor
                      onCancel={closeComment}
                      onSend={(content) => {
                        const data = {
                          ...c.data,
                          parent: c.id,
                          content,
                        };

                        postAppDataAsync({
                          data,
                          type: APP_DATA_TYPES.COMMENT,
                        })?.then((parent) => {
                          // when in a chatbot thread, should also post to the api
                          if (thread[0]?.type === APP_DATA_TYPES.BOT_COMMENT) {
                            const { chatbotPromptSettingId } =
                              thread[0]?.data ||
                              DEFAULT_CHATBOT_PROMPT_APP_DATA;
                            const promptSetting = chatbotPrompts.find(
                              (a) => a.id === chatbotPromptSettingId,
                            );

                            const chatbotThread: ChatbotThreadMessage[] =
                              thread.map((botThread) => ({
                                botDataType: APP_DATA_TYPES.BOT_COMMENT,
                                msgType: botThread.type,
                                data: botThread.data.content,
                              }));

                            const prompt = buildPrompt(
                              promptSetting?.data.initialPrompt,
                              chatbotThread,
                              `${content}${code}`,
                            );

                            const newData = {
                              ...data,
                              parent: parent?.id,
                              content: CHAT_BOT_ERROR_MESSAGE,
                            };

                            postChatBot(prompt)
                              .then((chatBotRes) => {
                                newData.content = chatBotRes.completion;
                              })
                              .finally(() => {
                                postAppDataAsync({
                                  data: newData,
                                  type: APP_DATA_TYPES.BOT_COMMENT,
                                });
                                postAction({
                                  data: newData,
                                  type: APP_ACTIONS_TYPES.CREATE_COMMENT,
                                });
                              });

                            postAction({
                              data: { prompt },
                              type: APP_ACTIONS_TYPES.SEND_PROMPT,
                            });
                          }
                        });
                        postAction({
                          data,
                          type: APP_ACTIONS_TYPES.RESPOND_COMMENT,
                        });
                        closeComment();
                      }}
                      comment={copyWithEmptyContent(c)}
                    />
                  )
                }
              </Fragment>
            ))}
          </CommentContainer>
        ))}
      </>
    );
  }
  return <Alert severity="warning">Loading Chatbot prompts</Alert>;
};

export default CommentThread;
