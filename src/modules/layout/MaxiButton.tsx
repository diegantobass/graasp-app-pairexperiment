import { FC, ReactElement } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Button,
  ButtonProps,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { BUTTON_LOADER_SIZE } from '../../config/constants';

type Props = {
  id?: string;
  dataCy?: string;
  text: string;
  icon: ReactElement;
  tooltip: string;
  disabled?: boolean;
  isLoading?: boolean;
  color?: ButtonProps['color'];
  onClick: () => void;
};

const MaxiButton: FC<Props> = ({
  id,
  dataCy,
  text,
  icon,
  tooltip,
  disabled = false,
  isLoading = false,
  color = 'primary',
  onClick,
}) => {
  const theme = useTheme();
  const bigScreen = useMediaQuery(theme.breakpoints.up('sm'));

  if (bigScreen) {
    if (isLoading) {
      return (
        <LoadingButton
          loading={isLoading}
          data-cy={dataCy}
          id={id}
          disabled={disabled}
          color={color}
          variant="outlined"
          startIcon={icon}
          onClick={onClick}
        >
          {text}
        </LoadingButton>
      );
    }
    return (
      <Tooltip title={tooltip}>
        <span>
          <Button
            data-cy={dataCy}
            id={id}
            disabled={disabled}
            color={color}
            variant="outlined"
            startIcon={icon}
            onClick={onClick}
          >
            {text}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          color={color}
          disabled={disabled || isLoading}
          data-cy={dataCy}
          id={id}
          onClick={onClick}
        >
          {isLoading ? <CircularProgress size={BUTTON_LOADER_SIZE} /> : icon}
        </IconButton>
      </span>
    </Tooltip>
  );
};
export default MaxiButton;
