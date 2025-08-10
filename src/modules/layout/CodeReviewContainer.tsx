import { styled } from '@mui/material';

import { SMALL_BORDER_RADIUS } from '../../config/layout';

const CodeReviewContainer = styled('div')(({ theme }) => ({
  margin: 'auto',
  fontSize: '1rem',
  padding: theme.spacing(2),
  maxWidth: '1200px',
  height: '100%',
  width: '80vw',
  borderRadius: SMALL_BORDER_RADIUS,
  wordWrap: 'break-word',
}));

export default CodeReviewContainer;
