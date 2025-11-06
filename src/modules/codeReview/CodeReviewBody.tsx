import React, { Fragment } from 'react';

import { Add } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';

import { AppDataVisibility } from '@graasp/sdk';

// import groupBy from 'lodash.groupby';
import { Highlight, Language, themes } from 'prism-react-renderer';

import { APP_ACTIONS_TYPES } from '../../config/appActionsTypes';
import { APP_DATA_TYPES } from '../../config/appDataTypes';
import { GENERAL_SETTINGS_NAME } from '../../config/appSettingsTypes';
import { REVIEW_MODE_COLLABORATIVE } from '../../config/constants';
import { SMALL_BORDER_RADIUS } from '../../config/layout';
import { mutations } from '../../config/queryClient';
import {
  CODE_REVIEW_ADD_BUTTON_CYPRESS,
  CODE_REVIEW_LINE_CONTENT_CYPRESS,
  CODE_REVIEW_LINE_CYPRESS,
  LINE_NUMBERS_CY,
  buildAddButtonDataCy,
} from '../../config/selectors';
import {
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_SHOW_LINE_NUMBERS_SETTING,
} from '../../config/settings';
import { GeneralSettingsKeys } from '../../interfaces/settings';
import { buildCodeRowKey } from '../../utils/utils';
import ChatbotPrompts from '../chatbot/ChatbotPrompts';
import CommentEditor from '../common/CommentEditor';
import CommentThread from '../common/CommentThread';
import { useAppDataContext } from '../context/AppDataContext';
import { useCodeVersionContext } from '../context/CodeVersionContext';
import LoadingIndicatorProvider from '../context/LoadingIndicatorContext';
import { useReviewContext } from '../context/ReviewContext';
import { useSettings } from '../context/SettingsContext';
import { useVisibilityContext } from '../context/VisibilityContext';

const Code = styled('div')({
  margin: 0,
  background: 'transparent !important',
});

const Line = styled('pre')({
  display: 'table-row',
  whiteSpace: 'pre-wrap',
  margin: 0,
  // make the "add" button appear when hovering on the line
  '&:hover button': {
    opacity: 1,
  },
});

const LineNoContainer = styled('div')({
  display: 'table-cell',
  paddingRight: '1em',
  minWidth: '5rem',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  userSelect: 'none',
});

const LineNo = styled('span')({
  opacity: 0.5,
  minWidth: '3rem',
  textAlign: 'right',
  paddingRight: '1rem',
});

const addButtonHoverStyle = {
  opacity: 1,
  backgroundColor: 'var(--graasp-primary)',
  transition: 'transform .1s ease-in-out',
  transform: 'scale(1, 1)',
  '& svg': {
    fill: 'white',
  },
};

const AddButton = styled(IconButton)({
  height: '1.5rem',
  width: '1.5rem',
  opacity: 0.3,
  borderRadius: SMALL_BORDER_RADIUS,
  // shrink the icon to have the spring out effect
  transform: 'scale(0.8, 0.8)',
  '&:hover': addButtonHoverStyle,
});

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {
  isPreset?: boolean;
};

const CodeReviewBody = ({ isPreset = false }: Props): JSX.Element => {
  const { addComment, multilineRange, currentCommentLine, closeComment } =
    useReviewContext();
  const { codeVersion, codeId } = useCodeVersionContext();
  const { code, language } = codeVersion;
  const { lineHiddenState } = useVisibilityContext();
  const { [GENERAL_SETTINGS_NAME]: settings = DEFAULT_GENERAL_SETTINGS } =
    useSettings();
  const allowComments = settings[GeneralSettingsKeys.AllowComments];
  // Define and get the value of ShowLineNumber from what the user has set from the App settings.
  const showLineNumbers =
    settings[GeneralSettingsKeys.ShowLineNumbers] ??
    DEFAULT_SHOW_LINE_NUMBERS_SETTING;
  const reviewMode = settings[GeneralSettingsKeys.ReviewMode];
  const { postAppData, comments } = useAppDataContext();
  const { mutate: postAction } = mutations.usePostAppAction();
  const versionComments = comments?.filter((c) => c.data.codeId === codeId);
  // filter out comments that should not be displayed in the presetView
  const viewComments = versionComments?.filter(
    (c) => (isPreset && c.type === APP_DATA_TYPES.TEACHER_COMMENT) || !isPreset,
  );
  // const groupedComments = groupBy(viewComments, (c) => c.data.line);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    i: number,
  ): void => {
    // support multiline selection by holding shift on click
    if (e.shiftKey) {
      addComment(i, true);
      return;
    }
    addComment(i);
  };

  return (
    <Highlight
      theme={themes.vsLight}
      code={code}
      language={language as Language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Code className={className} style={style}>
          {tokens.map((line, i) => (
            // container to host the line and the comment thread
            <Fragment key={buildCodeRowKey(line, i)}>
              <Line
                data-cy={CODE_REVIEW_LINE_CYPRESS}
                id={buildCodeRowKey(line, i)}
                {...getLineProps({
                  line,
                  key: i,
                })}
              >
                <LineNoContainer>
                  {
                    // Control the visibility of lines' numbers, and "add comment" Button conditionally, by checking if we have empty content to review,
                    // And if it's empty, then just show "add comment" Button 'as there is nothing to show to review on the screen',
                    // And if it's not empty and the user has chosen to whether keep or hide lines' numbers, it will do that by whether including "<LineNo>" tag or not.
                    showLineNumbers ? (
                      <LineNo data-cy={LINE_NUMBERS_CY}>{i + 1}</LineNo>
                    ) : null
                  }
                  {allowComments && (
                    <AddButton
                      data-cy={CODE_REVIEW_ADD_BUTTON_CYPRESS}
                      button-cy={buildAddButtonDataCy(i)}
                      size="medium"
                      sx={
                        // add hover style on buttons that are in the selected line range
                        (multilineRange?.end &&
                          multilineRange?.start &&
                          multilineRange?.start <= i &&
                          multilineRange?.end > i) ||
                        currentCommentLine === i ||
                        (multilineRange?.start || 0) === i
                          ? addButtonHoverStyle
                          : null
                      }
                      onClick={(e) => handleClick(e, i)}
                    >
                      <Add fontSize="inherit" color="primary" />
                    </AddButton>
                  )}
                </LineNoContainer>
                <div data-cy={CODE_REVIEW_LINE_CONTENT_CYPRESS}>
                  {line.map((token, key) => (
                    <span
                      key={`code-${key}-${line}`}
                      {...getTokenProps({
                        token,
                        key,
                      })}
                    />
                  ))}
                </div>
              </Line>
              {currentCommentLine === i && (
                <CommentEditor
                  maxTextLength={settings[GeneralSettingsKeys.MaxCommentLength]}
                  onCancel={closeComment}
                  onSend={(text) => {
                    const data = {
                      content: text,
                      line: i,
                      // codeId corresponding to current code version
                      codeId,
                      // comment on top level has no parent
                      parent: null,
                      ...(multilineRange?.start &&
                        multilineRange?.end && {
                          multiline: multilineRange,
                        }),
                    };
                    postAppData({
                      data,
                      type: isPreset
                        ? APP_DATA_TYPES.TEACHER_COMMENT
                        : APP_DATA_TYPES.COMMENT,
                      visibility:
                        isPreset || reviewMode === REVIEW_MODE_COLLABORATIVE
                          ? AppDataVisibility.Item
                          : AppDataVisibility.Member,
                    });
                    postAction({
                      data,
                      type: APP_ACTIONS_TYPES.CREATE_COMMENT,
                    });
                    closeComment();
                  }}
                />
              )}
              <LoadingIndicatorProvider>
                <ChatbotPrompts line={i} />
                <CommentThread hiddenState={lineHiddenState[i]}>
                  {viewComments}
                </CommentThread>
              </LoadingIndicatorProvider>
            </Fragment>
          ))}
        </Code>
      )}
    </Highlight>
  );
};

export default CodeReviewBody;
