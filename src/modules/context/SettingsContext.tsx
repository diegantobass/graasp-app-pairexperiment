import { ReactElement, createContext, useContext } from 'react';

import { AppSetting } from '@graasp/sdk';

import {
  APP_MODE_SETTINGS_NAME,
  CHATBOT_PROMPT_SETTINGS_NAME,
  CODE_EXECUTION_SETTINGS_NAME,
  DATA_FILE_LIST_SETTINGS_NAME,
  DATA_FILE_SETTINGS_NAME,
  DIFF_VIEW_SETTINGS_NAME,
  GENERAL_SETTINGS_NAME,
  INSTRUCTOR_CODE_VERSION_SETTINGS_NAME,
} from '../../config/appSettingsTypes';
import { hooks, mutations } from '../../config/queryClient';
import {
  DEFAULT_APP_MODE_SETTINGS,
  DEFAULT_CODE_EXECUTION_SETTINGS,
  DEFAULT_DATA_FILE_LIST_SETTINGS,
  DEFAULT_DIFF_VIEW_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_INSTRUCTOR_CODE_VERSION_SETTINGS,
} from '../../config/settings';
import {
  AppModeSettings,
  CodeExecutionSettings,
  DataFileListSettings,
  DiffViewSettings,
  GeneralSettings,
  InstructorCodeVersionSettings,
} from '../../interfaces/settings';

// mapping between Setting names and their data type
interface AllSettingsType {
  [GENERAL_SETTINGS_NAME]?: GeneralSettings;
  [CODE_EXECUTION_SETTINGS_NAME]?: CodeExecutionSettings;
  [INSTRUCTOR_CODE_VERSION_SETTINGS_NAME]?: InstructorCodeVersionSettings;
  [APP_MODE_SETTINGS_NAME]?: AppModeSettings;
  [DATA_FILE_LIST_SETTINGS_NAME]?: DataFileListSettings;
  [DIFF_VIEW_SETTINGS_NAME]?: DiffViewSettings;
}

// default values for the data property of settings by name
const defaultSettingsValues: AllSettingsType = {
  [GENERAL_SETTINGS_NAME]: DEFAULT_GENERAL_SETTINGS,
  [CODE_EXECUTION_SETTINGS_NAME]: DEFAULT_CODE_EXECUTION_SETTINGS,
  [INSTRUCTOR_CODE_VERSION_SETTINGS_NAME]:
    DEFAULT_INSTRUCTOR_CODE_VERSION_SETTINGS,
  [APP_MODE_SETTINGS_NAME]: DEFAULT_APP_MODE_SETTINGS,
  [DATA_FILE_LIST_SETTINGS_NAME]: DEFAULT_DATA_FILE_LIST_SETTINGS,
  [DIFF_VIEW_SETTINGS_NAME]: DEFAULT_DIFF_VIEW_SETTINGS,
};

// list of the settings names
const ALL_SETTING_NAMES = [
  GENERAL_SETTINGS_NAME,
  CODE_EXECUTION_SETTINGS_NAME,
  INSTRUCTOR_CODE_VERSION_SETTINGS_NAME,
  APP_MODE_SETTINGS_NAME,
  DATA_FILE_LIST_SETTINGS_NAME,
  DIFF_VIEW_SETTINGS_NAME,
] as const;

// automatically generated types
// eslint-disable-next-line prettier/prettier
type AllSettingsNameType = (typeof ALL_SETTING_NAMES)[number];
type AllSettingsDataType = AllSettingsType[keyof AllSettingsType];

export type SettingsContextType = AllSettingsType & {
  dataFileSettings: AppSetting[];
  saveSettings: (
    name: AllSettingsNameType,
    newValue: AllSettingsDataType,
  ) => void;
};

const defaultContextValue = {
  ...defaultSettingsValues,
  dataFileSettings: [],
  saveSettings: () => null,
};

const SettingsContext = createContext<SettingsContextType>(defaultContextValue);

type Props = {
  children: ReactElement | ReactElement[];
};

export const SettingsProvider = ({ children }: Props): JSX.Element => {
  const postSettings = mutations.usePostAppSetting();
  const patchSettings = mutations.usePatchAppSetting();
  const { data: appSettingsList, isSuccess } = hooks.useAppSettings();

  const saveSettings = (
    name: AllSettingsNameType,
    newValue: AllSettingsDataType,
  ): void => {
    if (appSettingsList) {
      const previousSetting = appSettingsList.find((s) => s.name === name);
      // setting does not exist
      if (!previousSetting) {
        postSettings.mutate({
          data: newValue,
          name,
        });
      } else {
        patchSettings.mutate({
          id: previousSetting.id,
          data: newValue,
        });
      }
    }
  };

  const getContextValue = (): SettingsContextType => {
    if (isSuccess) {
      const allSettings: AllSettingsType = ALL_SETTING_NAMES.reduce(
        <T extends AllSettingsNameType>(acc: AllSettingsType, key: T) => {
          const setting = appSettingsList.find((s) => s.name === key);
          const settingData = setting?.data;
          acc[key] = settingData as AllSettingsType[T] | undefined;
          return acc;
        },
        {},
      );

      const dataFileSettings = appSettingsList.filter((s) =>
        s.name.startsWith(DATA_FILE_SETTINGS_NAME),
      );

      return {
        ...allSettings,
        dataFileSettings,
        saveSettings,
      };
    }
    return defaultContextValue;
  };

  const contextValue = getContextValue();

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType =>
  useContext<SettingsContextType>(SettingsContext);
