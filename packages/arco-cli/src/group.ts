import chalk from 'chalk';
import inquirer from 'inquirer';
import { print } from '@arco-design/arco-dev-utils';
import { request } from '@arco-design/arco-cli-auth';

import locale from './locale';

export async function listAllGroups() {
  await queryGroup();
}

export async function queryGroup(id?: number) {
  const queryParams = {};

  if (id !== undefined) {
    (queryParams as any).id = +id;
  }

  const { result: groups } = await request.post('group', queryParams);

  if (groups.length) {
    groups.forEach((group) => {
      print.success(`\n${group.name}: `);
      group.members.forEach((member, index) => {
        print(chalk.green(`${index + 1}.`), member.name, chalk.green(member.role));
      });
    });
  } else {
    print.warn(`Group ${id} not found`);
  }
}

export async function addGroupMember(id) {
  const questions = [
    {
      type: 'input',
      name: 'username',
      message: locale.TIP_ADD_GROUP_MEMBER,
    },
    {
      type: 'list',
      name: 'role',
      choices: [
        {
          name: locale.LABEL_GROUP_OWNER,
          value: 'owner',
        },
        {
          name: locale.LABEL_GROUP_MASTER,
          value: 'master',
        },
      ],
    },
  ];
  const { username, role } = await inquirer.prompt(questions);

  try {
    const { ok, msg } = await request.post('group/update', {
      id: Number(id),
      members: {
        username,
        role,
      },
    });

    if (ok) {
      print.success(`${locale.TIP_ADD_GROUP_MEMBER_SUCCESS}${username}`);
    } else if (msg) {
      print.error(`${locale.TIP_ADD_GROUP_MEMBER_FAIL}${username}`);
      print.error(msg);
    }
  } catch (err) {
    print.error(err);
  }
}

export async function deleteGroupMember(id) {
  const questions = [
    {
      type: 'input',
      name: 'username',
      message: locale.TIP_REMOVE_GROUP_MEMBER,
    },
  ];
  const { username } = await inquirer.prompt(questions);

  try {
    const { ok, msg } = await request.post('group/update', {
      id: Number(id),
      members: {
        username,
        remove: true,
      },
    });

    if (ok) {
      print.success(`${locale.TIP_REMOVE_GROUP_MEMBER_SUCCESS}${username}`);
    } else if (msg) {
      print.error(`${locale.TIP_REMOVE_GROUP_MEMBER_FAIL}${username}`);
      print.error(msg);
    }
  } catch (err) {
    print.error(err);
  }
}
