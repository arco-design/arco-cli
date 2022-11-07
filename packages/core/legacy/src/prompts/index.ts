import prompt from './prompt';
import analyticsSchema from './schemas/analyticsReporting';
import errorReportingSchema from './schemas/errorReporting';
import userpassSchema from './schemas/userPassword';
import approveOperationSchema from './schemas/approveOperation';

const userpass = prompt(userpassSchema);
const approveOperation = prompt(approveOperationSchema);
const analyticsPrompt = prompt(analyticsSchema);
const errorReportingPrompt = prompt(errorReportingSchema);

export { userpass, approveOperation, analyticsPrompt, errorReportingPrompt };
