import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Save,
  Square,
} from '@mui/icons-material';
import { Stack } from '@mui/material';

import { PyodideStatus } from '@graasp/pyodide';

import { BrushCleaningIcon } from 'lucide-react';

import {
  REPL_CLEAR_BUTTON_CY,
  REPL_FULL_SCREEN_BUTTON_CY,
  REPL_RUN_CODE_BUTTON_CY,
  REPL_SAVE_BUTTON_CY,
  REPL_STOP_BUTTON_CY,
} from '../../config/selectors';
import MaxiButton from '../layout/MaxiButton';
import MiniAlert from '../layout/MiniAlert';
import MiniButton from '../layout/MiniButton';
import ReplStatusIndicator from './ReplStatusIndicator';

type Props = {
  // onRunCode: () => void;
  onMaxiRunCode: () => void;
  onStopCode: () => void;
  onClearOutput: () => void;
  onSaveCode: () => void;
  onFullscreen: () => void;
  status: PyodideStatus;
  savedStatus: boolean;
  isFullscreen: boolean;
};

const ReplToolbar: FC<Props> = ({
  // onRunCode,
  onMaxiRunCode,
  onStopCode,
  onClearOutput,
  onSaveCode,
  onFullscreen,
  status,
  savedStatus,
  isFullscreen,
}) => {
  const { t } = useTranslation();
  const isLoading = [
    PyodideStatus.LOADING_MODULE,
    PyodideStatus.LOADING_PYODIDE,
    PyodideStatus.INSTALLING,
    PyodideStatus.ERROR,
  ].includes(status);
  const isRunning = [PyodideStatus.RUNNING, PyodideStatus.WAIT_INPUT].includes(
    status,
  );

  return (
    <Stack direction="row" spacing={1}>
      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        width="50%"
      >
        <ReplStatusIndicator status={status} />
        <Stack direction="row" spacing={1} alignItems="center">
          {!savedStatus && <MiniAlert />}
          <MiniButton
            dataCy={REPL_SAVE_BUTTON_CY}
            icon={<Save />}
            onClick={onSaveCode}
            disabled={savedStatus}
            tooltip={t('Save Code')}
            text={savedStatus ? t('Saved') : t('Save')}
          />
          {/* <MiniButton
            dataCy={REPL_RUN_CODE_BUTTON_CY}
            isLoading={isLoading}
            disabled={isRunning}
            icon={<PlayArrow />}
            onClick={onRunCode}
            text={t('Run')}
            tooltip={t('Run Code')}
          /> */}
          <MaxiButton
            dataCy={REPL_RUN_CODE_BUTTON_CY}
            isLoading={isLoading}
            disabled={isRunning}
            icon={<PlayArrow />}
            onClick={onMaxiRunCode}
            text="Run"
            tooltip="Code"
          />
        </Stack>
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={1}
        width="50%"
      >
        <MiniButton
          dataCy={REPL_STOP_BUTTON_CY}
          color="error"
          disabled={!isRunning}
          icon={<Square />}
          onClick={onStopCode}
          text={t('Stop')}
          tooltip={t('Stop Execution')}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <MiniButton
            dataCy={REPL_FULL_SCREEN_BUTTON_CY}
            color="primary"
            icon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            onClick={onFullscreen}
            tooltip={t('Toggle Fullscreen')}
            text=""
          />
          <MiniButton
            dataCy={REPL_CLEAR_BUTTON_CY}
            color="error"
            icon={<BrushCleaningIcon />}
            onClick={onClearOutput}
            tooltip={t('Clear outputs and figures')}
            text={t('Clear')}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
export default ReplToolbar;
