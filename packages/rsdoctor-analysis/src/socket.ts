import { getDataFileFromArgs, sendRequestFromJson } from './datasource';

/**
 * Send request (only JSON file mode is supported now)
 */
export const sendRequest = async (
  api: string,
  params: Record<string, unknown> = {},
): Promise<unknown> => {
  return sendRequestFromJson(api, params);
};

/**
 * Get data file path (for compatibility)
 */
export const getWsUrl = async (): Promise<string> => {
  const filePath = getDataFileFromArgs();
  if (!filePath) {
    throw new Error('No data file specified. Use --data-file <path>');
  }
  return `file://${filePath}`;
};

/**
 * Close all connections (not needed now, but kept for compatibility)
 */
export const closeAllSockets = (): void => {
  // JSON mode doesn't need to close connections
};
