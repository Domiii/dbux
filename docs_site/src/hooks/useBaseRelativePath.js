import { useLocation } from '@docusaurus/router';
import useBaseUrl from './useBaseUrl';

/**
 * @return {string}
 */
export default function useBaseRelativePath() {
  const location = useLocation();
  const baseUrl = useBaseUrl();
  const { pathname } = location;

  return pathname.substring(baseUrl.length);
}