import inquirer from 'inquirer';

/**
 * Confirm
 * @param checkFunc
 * @param message
 * @returns {Promise<boolean|*>}
 */
export default async (checkFunc, message) => {
  if (checkFunc()) {
    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message,
      default: false,
    });

    return answer.confirm;
  }

  return true;
};
