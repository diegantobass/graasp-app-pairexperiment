import { Context, PermissionLevel } from '@graasp/sdk';

import {
  AppModeSettings,
  AppModeSettingsKeys,
  ChatbotPromptSettings,
  ChatbotPromptSettingsKeys,
  CodeExecutionSettings,
  CodeExecutionSettingsKeys,
  DataFileListSettings,
  DataFileListSettingsKeys,
  DiffViewSettings,
  DiffViewSettingsKeys,
  GeneralSettings,
  GeneralSettingsKeys,
  InstructorCodeSettingsKeys,
  InstructorCodeVersionSettings,
} from '../interfaces/settings';
import { AppMode } from './appSettingsTypes';
import { REVIEW_MODE_INDIVIDUAL } from './constants';
import { AppView } from './layout';
import { PYTHON } from './programmingLanguages';

export const DEFAULT_APP_MODE = AppMode.Execute;
export const DEFAULT_APP_VIEW = AppView.CodeExecution;

export const DEFAULT_CONTEXT = Context.Builder;
export const DEFAULT_PERMISSION = PermissionLevel.Read;
export const DEFAULT_LINE_HIDDEN_STATE = false;

export const DEFAULT_CONTEXT_API_HOST = '';
export const DEFAULT_CONTEXT_ITEM_ID = '';
export const DEFAULT_CONTEXT_LANGUAGE = 'en';
export const DEFAULT_CONTEXT_STANDALONE = false;
export const DEFAULT_CONTEXT_OFFLINE = false;
export const DEFAULT_CONTEXT_DEV = false;
export const DEFAULT_CONTEXT_SETTINGS = {};

// default values
export const DEFAULT_SHOW_HEADER_SETTING = false;
export const DEFAULT_SHOW_TOOLBAR_SETTING = false;
export const DEFAULT_SHOW_LINE_NUMBERS_SETTING = false;
export const DEFAULT_SHOW_VERSION_NAVIGATION_SETTING = false;
export const DEFAULT_SHOW_EDIT_BUTTON_SETTING = false;
export const DEFAULT_SHOW_RUN_BUTTON_SETTING = false;
export const DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING = false;
export const DEFAULT_ALLOW_COMMENTS_SETTING = false;
export const DEFAULT_ALLOW_REPLIES_SETTING = false;
export const DEFAULT_ALLOW_COMMENT_REPORTING = false;
export const DEFAULT_PROGRAMMING_LANGUAGE_SETTING = PYTHON;
export const DEFAULT_CODE_SETTING = '';
export const DEFAULT_COMMIT_MESSAGE_SETTING = '';
export const DEFAULT_COMMIT_DESCRIPTION_SETTING = '';
export const DEFAULT_MAX_COMMENT_LENGTH_SETTING = 5_000;
export const DEFAULT_MAX_THREAD_LENGTH_SETTING = 1_000;

export const DEFAULT_REVIEW_MODE_SETTING = REVIEW_MODE_INDIVIDUAL;

// default settings object
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  [GeneralSettingsKeys.ShowHeader]: DEFAULT_SHOW_HEADER_SETTING,
  [GeneralSettingsKeys.ShowToolbar]: DEFAULT_SHOW_TOOLBAR_SETTING,
  [GeneralSettingsKeys.ShowLineNumbers]: DEFAULT_SHOW_LINE_NUMBERS_SETTING,
  [GeneralSettingsKeys.ShowVersionNavigation]:
    DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
  [GeneralSettingsKeys.ShowEditButton]: DEFAULT_SHOW_EDIT_BUTTON_SETTING,
  [GeneralSettingsKeys.ShowRunButton]: DEFAULT_SHOW_RUN_BUTTON_SETTING,
  [GeneralSettingsKeys.ShowVisibilityButton]:
    DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING,
  [GeneralSettingsKeys.AllowComments]: DEFAULT_ALLOW_COMMENTS_SETTING,
  [GeneralSettingsKeys.AllowReplies]: DEFAULT_ALLOW_REPLIES_SETTING,
  [GeneralSettingsKeys.AllowCommentsReporting]: DEFAULT_ALLOW_COMMENT_REPORTING,
  [GeneralSettingsKeys.ReviewMode]: DEFAULT_REVIEW_MODE_SETTING,
  [GeneralSettingsKeys.MaxCommentLength]: DEFAULT_MAX_COMMENT_LENGTH_SETTING,
  [GeneralSettingsKeys.MaxThreadLength]: DEFAULT_MAX_THREAD_LENGTH_SETTING,
};

// default Instructor Code Version settings
export const DEFAULT_INSTRUCTOR_CODE_VERSION_SETTINGS: InstructorCodeVersionSettings =
  {
    [InstructorCodeSettingsKeys.Code]: DEFAULT_CODE_SETTING,
    [InstructorCodeSettingsKeys.Language]: DEFAULT_PROGRAMMING_LANGUAGE_SETTING,
    [InstructorCodeSettingsKeys.CommitMessage]: DEFAULT_COMMIT_MESSAGE_SETTING,
    [InstructorCodeSettingsKeys.CommitDescription]:
      DEFAULT_COMMIT_DESCRIPTION_SETTING,
  };

// code Execution settings
export const DEFAULT_CODE_EXECUTION_SETTINGS: CodeExecutionSettings = {
  [CodeExecutionSettingsKeys.HeaderCode]: '',
  [CodeExecutionSettingsKeys.FooterCode]: '',
  [CodeExecutionSettingsKeys.PreLoadedLibraries]: '',
};

// app mode setting
export const DEFAULT_APP_MODE_SETTINGS: AppModeSettings = {
  [AppModeSettingsKeys.Mode]: DEFAULT_APP_MODE,
};

// app mode setting
export const DEFAULT_DATA_FILE_LIST_SETTINGS: DataFileListSettings = {
  [DataFileListSettingsKeys.Files]: [],
};

// diff view setting
export const DEFAULT_DIFF_VIEW_SETTINGS: DiffViewSettings = {
  [DiffViewSettingsKeys.Language]: DEFAULT_PROGRAMMING_LANGUAGE_SETTING,
  [DiffViewSettingsKeys.OldCode]: '',
  [DiffViewSettingsKeys.NewCode]: '',
  [DiffViewSettingsKeys.LinesOffset]: 0,
};

// chatbot prompt setting
export const DEFAULT_CHATBOT_PROMPT_SETTINGS: ChatbotPromptSettings = {
  [ChatbotPromptSettingsKeys.InitialPrompt]: '',
  [ChatbotPromptSettingsKeys.ChatbotPrompt]: '',
  [ChatbotPromptSettingsKeys.LineNumber]: 0,
};
