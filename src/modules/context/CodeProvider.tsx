import React, {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_LINE_HIDDEN_STATE } from '../../config/settings';
import { useCodeVersionContext } from './CodeVersionContext';

type CodeContextType = {
  code: string;
};
// eslint-disable-next-line @typescript-eslint/ban-types
type Prop = {code: string};

const defaultContextValue: CodeContextType = {
  code: "",
};

const CodeContext =
  createContext<CodeContextType>(defaultContextValue);

export const CodeProvider: FC<PropsWithChildren<Prop>> = ({
  children,
  code,
}) => {
  // todo: add code from codeVersions and compute the number of lines

  const contextValue = {code};

  return (
    <CodeContext.Provider value={contextValue}>
      {children}
    </CodeContext.Provider>
  );
};

export const useCodeContext = (): CodeContextType =>
  useContext<CodeContextType>(CodeContext);
