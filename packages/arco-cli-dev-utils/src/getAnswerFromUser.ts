import semver from 'semver';
import inquirer from 'inquirer';

import locale from './locale';
import getLocale from './getLocale';
import {
  QNode,
  Filter,
  Answer,
  FilterPropertyRule,
  CliQuestion,
  Message,
  getBaseConfig,
} from './baseConfig';

const LOCALE = getLocale();

/**
 * Get valid item by filter
 */
function isValid(filter: Filter, filterParams: Record<keyof Filter, Answer>): boolean {
  if (!filter) {
    return true;
  }

  const cliVersion = (global as any).ARCO_CLI_VERSION;

  for (const key in filter) {
    if (key === 'version') {
      if (cliVersion && semver.lt(cliVersion, filter[key])) {
        return false;
      }

      continue;
    }

    if (typeof filter[key] === 'boolean') {
      if (filter[key] !== filterParams[key]) {
        return false;
      }

      continue;
    }

    if (typeof filter[key] === 'object') {
      const { type, value } = filter[key] as FilterPropertyRule;
      const index = Array.isArray(value) ? value.indexOf(filterParams[key]) : null;

      if (
        index !== null &&
        ((type === 'include' && index === -1) || (type === 'exclude' && index !== -1))
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Ask user a question by inquirer
 */
async function askQuestion(
  { type, message, validate, choices, default: _default, allowCreate }: CliQuestion,
  currentInfo: Record<string, Answer>
): Promise<Answer> {
  type ParamsForInquirer = {
    name: 'result';
    type: 'input' | 'checkbox' | 'list';
    default: Answer;
    message: string;
    validate?: (input: string) => boolean | string;
    choices?: Array<{ name: string; value: Answer }>;
    loop?: boolean;
    pageSize?: number;
  };

  // Get message string by locale
  const transformMessage = (msg: Message): string => (typeof msg === 'object' ? msg[LOCALE] : msg);

  const choiceValueOfCustomInput = '__custom_input';
  const paramsForInquirer: ParamsForInquirer = {
    name: 'result',
    type,
    default: _default,
    message: transformMessage(message),
    loop: false,
    pageSize: 10,
  };

  if (type === 'input') {
    paramsForInquirer.validate = (input) => {
      const { rule, message } = validate || {};

      if (rule === 'required') {
        return input.trim() ? true : transformMessage(message);
      }

      return true;
    };
  }

  if (type === 'list' || type === 'checkbox') {
    const _choices: ParamsForInquirer['choices'] = [];

    // Filter valid choices
    if (Array.isArray(choices)) {
      for (const { _filter, _labelAsValue, label, value } of choices) {
        if (isValid(_filter, currentInfo)) {
          const name = transformMessage(label);
          _choices.push({
            name,
            value: _labelAsValue ? name : value,
          });
        }
      }
    }

    if (allowCreate) {
      _choices.push({
        name: locale.LABEL_CHOICE_CUSTOM_INPUT,
        value: choiceValueOfCustomInput,
      });
    }

    // Ask the user only if there is more than one choice
    if (_choices.length === 0) {
      return null;
    }
    if (_choices.length === 1 && _choices[0].value !== choiceValueOfCustomInput) {
      return _choices[0].value;
    }

    paramsForInquirer.choices = _choices;
  }

  const { result } = await inquirer.prompt(paramsForInquirer);

  if (
    (type === 'list' && result === choiceValueOfCustomInput) ||
    (type === 'checkbox' && result.indexOf(choiceValueOfCustomInput) > -1)
  ) {
    const { input } = await inquirer.prompt({
      type: 'input',
      name: 'input',
      message: locale.TIP_CUSTOM_INPUT,
    });
    const customInputValue = input
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter((item) => item);

    return type === 'checkbox'
      ? result.filter((item) => item !== choiceValueOfCustomInput).concat(customInputValue)
      : customInputValue[0];
  }

  return result;
}

function walkQuestionNodes({
  questions,
  callback,
  filterInherit = {},
  record = {},
}: {
  questions: QNode[];
  callback: (params: {
    question: CliQuestion;
    key: string;
    filter: Filter;
    record: Record<string, Answer>;
  }) => void;
  filterInherit?: Filter;
  record?: Record<string, any>;
}) {
  questions.forEach((node) => {
    const { _question, _filter, _key } = node;
    const filter = { ...filterInherit, ..._filter };

    if (Array.isArray(_question)) {
      record[_key] = walkQuestionNodes({
        callback,
        questions: _question,
        filterInherit: filter,
      });
    } else {
      callback({ question: _question, key: _key, filter, record });
    }
  });

  return record;
}

export default async function getAnswerFromUser<T = Record<string, any>>({
  command,
  baseInfo,
}: {
  command: 'init';
  baseInfo: T;
}): Promise<T> {
  const {
    question: { [command]: questions },
  } = await getBaseConfig();

  const info = { ...baseInfo };
  const taskQueue: Array<() => Promise<void>> = [];

  walkQuestionNodes({
    questions,
    record: info,
    callback: ({ question, key, filter, record }) => {
      // If there is a answer in baseInfo, skip asking
      if (record[key] === undefined) {
        taskQueue.push(async () => {
          if (isValid(filter, info as any)) {
            record[key] = await askQuestion(question, info as any);
          }
        });
      }
    },
  });

  const clearTasks = async () => {
    const task = taskQueue.shift();
    if (task) {
      await task();
      await clearTasks();
    }
  };

  await clearTasks();

  return info;
}
