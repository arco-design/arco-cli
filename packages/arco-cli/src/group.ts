import chalk from 'chalk';
import inquirer from 'inquirer';
import { getGlobalInfo, print, writeGlobalInfo } from 'arco-cli-dev-utils';
import { request } from 'arco-cli-auth';

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

export async function queryJoinedGroups(
  username: string
): Promise<Array<{ id: number; name: string }>> {
  const { result: groups } = await request.post('group', {
    member: username ? [username] : [],
  });
  return groups;
}

export async function linkGroup(id?: number) {
  const changeGlobalInfo = (groupId: number, groupName?: string) => {
    writeGlobalInfo({ group: groupId });
    print.success(
      groupId
        ? locale.TIP_LINK_GROUP_SUCCESS.replace('$groupName', groupName || `${groupId}`)
        : locale.TIP_UNLINK_GROUP_SUCCESS
    );
  };

  // Unlink group
  if (id === 0) {
    changeGlobalInfo(null);
    return;
  }

  const { userInfo } = getGlobalInfo();
  const joinedGroups = await queryJoinedGroups(userInfo?.username);

  // Link a specific group
  if (typeof id === 'number') {
    const targetGroup = joinedGroups.find(({ id: groupId }) => groupId === id);
    if (targetGroup) {
      changeGlobalInfo(id, targetGroup.name);
    } else {
      print.error(locale.TIP_NOT_MEMBER_OF_GROUP);
    }
    return;
  }

  // Link a joined group
  switch (joinedGroups.length) {
    case 0: {
      print.error(locale.TIP_NO_GROUP_JOINED);
      return;
    }

    case 1: {
      const { id: groupId, name: groupName } = joinedGroups[0];
      const { result } = await inquirer.prompt({
        type: 'confirm',
        name: 'result',
        message: locale.TIP_LINK_THE_ONLY_GROUP_JOINED.replace('$groupName', groupName),
        default: true,
      });
      if (result) {
        changeGlobalInfo(groupId, groupName);
      }
      return;
    }

    default: {
      const { groupId } = await inquirer.prompt({
        type: 'list',
        name: 'groupId',
        message: locale.PREFIX_LINK_GROUPS_JOINED,
        choices: joinedGroups.map(({ id, name }) => ({ name, value: id })),
      });

      if (groupId) {
        changeGlobalInfo(groupId, joinedGroups.find(({ id }) => groupId === id)?.name);
      }
    }
  }
}

export async function tryAutoLinkGroup() {
  try {
    const { userInfo, group: linkedGroupId } = await getGlobalInfo();
    if (userInfo?.username) {
      const joinedGroup = await queryJoinedGroups(userInfo.username);
      if (joinedGroup && joinedGroup.length) {
        const { id, name } = joinedGroup[0];
        if (id !== linkedGroupId) {
          const { result } = await inquirer.prompt({
            type: 'confirm',
            name: 'result',
            message: locale.TIP_LINK_GROUP_AFTER_LOGIN.replace('$groupName', name),
            default: true,
          });
          if (result) {
            writeGlobalInfo({ group: id });
            print.success(locale.TIP_LINK_GROUP_SUCCESS.replace('$groupName', name));
          }
        }
      }
    }
  } catch (e) {}
}
