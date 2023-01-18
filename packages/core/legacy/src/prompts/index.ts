import prompt from './prompt';
import analyticsSchema from './schemas/analyticsReporting';
import errorReportingSchema from './schemas/errorReporting';

const analyticsPrompt = prompt(analyticsSchema);
const errorReportingPrompt = prompt(errorReportingSchema);

export { analyticsPrompt, errorReportingPrompt };
