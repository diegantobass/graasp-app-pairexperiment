import { AppView } from '../../config/layout';
import { CODE_REVIEW_CONTAINER_CYPRESS } from '../../config/selectors';
import { CodeProvider } from '../context/CodeProvider';
import { ReviewProvider } from '../context/ReviewContext';
import { VisibilityProvider } from '../context/VisibilityContext';
import CodeReviewContainer from '../layout/CodeReviewContainer';
import CodeReviewBody from './CodeReviewBody';
import CodeReviewToolbar from './CodeReviewToolbar';

type Props = {
  setView?: (view: AppView) => void;
  isPreset?: boolean;
  code: string;
};

const CodeReview = ({ setView, isPreset, code }: Props): JSX.Element => (
  <ReviewProvider>
    <CodeProvider code={code}>
    <VisibilityProvider>
      <CodeReviewContainer data-cy={CODE_REVIEW_CONTAINER_CYPRESS}>
        <CodeReviewToolbar setView={setView} />
        <CodeReviewBody isPreset={isPreset} />
      </CodeReviewContainer>
    </VisibilityProvider>
    </CodeProvider>
  </ReviewProvider>
);

export default CodeReview;
