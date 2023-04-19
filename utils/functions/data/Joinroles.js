const { GuildConfig } = require('./Config');
const _ = require('underscore');

class Joinroles {
    constructor() {}

    get({ guild_id }) {
        return new Promise(async (resolve) => {
            const guild = await GuildConfig.get(guild_id);
            return resolve(guild.joinroles);
        });
    }

    update({ guild, roles, user }) {
        return new Promise(async (resolve, reject) => {
            const guildConfig = await GuildConfig.get(guild.id);
            let joinroles = guildConfig.joinroles;

            const rolesAlreadyExists = _.intersection(joinroles, roles);
            if (rolesAlreadyExists.length > 0) {
                await this.remove({
                    guild_id: guild.id,
                    roles: rolesAlreadyExists,
                }).catch((err) => {
                    return reject(err);
                });

                for (let i in rolesAlreadyExists) {
                    joinroles = joinroles.filter((r) => r !== rolesAlreadyExists[i]);
                    roles = roles.filter((r) => r !== rolesAlreadyExists[i]);
                }

                if (joinroles.length == 0) {
                    return resolve(`Successfully removed all joinroles`);
                }
            }
            let passedRoles = [];
            for (let i in roles) {
                let role;
                try {
                    role = guild.roles.cache.get(roles[i]);
                    if (role.tags && role.tags.botId) continue;
                } catch (err) {
                    return reject(
                        `${roles[i]} doesn't exists! All existing mentions before are saved.`
                    );
                }
                try {
                    if (!user.roles.cache.find((r) => r.id.toString() === role.id.toString())) {
                        await user.roles.add(role).catch((err) => {});
                        await user.roles.remove(role).catch((err) => {});
                    } else {
                        await user.roles.remove(role).catch((err) => {});
                        await user.roles.add(role).catch((err) => {});
                    }
                } catch (err) {
                    return reject(`I don't have the permission to add this role: **${role}**`);
                }
                passedRoles.push(role.id);
            }

            return await GuildConfig.update({
                guild_id: guild.id,
                value: [...passedRoles, ...joinroles],
                valueName: 'joinroles',
            })
                .then(() => {
                    if (joinroles.length === 0 && passedRoles.length === 0) {
                        resolve(`Joinroles successfully cleared.`);
                    } else {
                        resolve(`Successfully updated all joinroles`);
                    }
                })
                .catch(() => {
                    reject(
                        `Something went wrong while updating the joinroles config. Please try again later.`
                    );
                });
        });
    }

    remove({ guild_id, roles }) {
        return new Promise(async (resolve, reject) => {
            let joinroles = await this.get({
                guild_id,
            });

            for (let i in roles) {
                joinroles = joinroles.filter((r) => r !== roles[i]);
            }

            await GuildConfig.update({
                guild_id,
                value: joinroles,
                valueName: 'joinroles',
            })
                .then(() => {
                    resolve(`Successfully removed all joinroles`);
                })
                .catch(() => {
                    reject(`Something went wrong while removing the joinroles.`);
                });
        });
    }
}

module.exports.Joinroles = new Joinroles();
