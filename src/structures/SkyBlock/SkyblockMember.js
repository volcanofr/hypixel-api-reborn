/* eslint-disable camelcase */
const { decode, getLevelByXp, getLevelByAchievement, getSlayerLevel } = require('../../utils/SkyblockUtils');
const { skyblock_year_0, skills, skills_achievements, pet_score } = require('../../utils/Constants');
const Armor = require('./SkyblockArmor');
const Item = require('./SkyblockItem');
const objectPath = require('object-path');

class SkyblockMember {
  constructor (data) {
    this.uuid = data.uuid;
    this.player = data.m.player;
    this.profileName = data.profileName;
    this.gameMode = data.gameMode;
    this.firstJoinTimestamp = data.m.first_join;
    this.firstJoinAt = new Date(data.m.first_join);
    this.lastSave = data.m.last_save;
    this.lastSaveAt = new Date(data.m.last_save);
    this.lastDeathAt = new Date(skyblock_year_0 + data.m.last_death * 1000);
    this.lastDeath = data.m.last_death;
    this.getArmor = async () => {
      const base64 = data.m.inv_armor;
      const decoded = await decode(base64.data);
      const armor = {
        helmet: decoded[3].id ? new Armor(decoded[3]) : null,
        chestplate: decoded[2].id ? new Armor(decoded[2]) : null,
        leggings: decoded[1].id ? new Armor(decoded[1]) : null,
        boots: decoded[0].id ? new Armor(decoded[0]) : null
      };
      return armor;
    };
    this.fairySouls = data.m.fairy_souls_collected || 0;
    this.skills = getSkills(data.m);
    this.slayer = getSlayer(data.m);
    this.dungeons = getDungeons(data.m);
    this.collections = data.m.collection ? data.m.collection : null;
    this.getEnderChest = async () => {
      const chest = data.m.ender_chest_contents;
      if (!chest) return null;

      try {
        const enderChest = await decode(chest.data);

        const edited = [];
        for (let i = 0; i < enderChest.length; i++) {
          if (!enderChest[i].id) {
            continue;
          }
          edited.push(new Item(enderChest[i]));
        }
        return edited;
      } catch (e) {
        return e;
      }
    };
    this.getInventory = async () => {
      let inventory = data.m.inv_contents;
      if (!inventory) return null;

      try {
        inventory = await decode(inventory.data);
        const edited = [];
        for (let i = 0; i < inventory.length; i++) {
          if (!inventory[i].id) {
            continue;
          }
          edited.push(new Item(inventory[i]));
        }
        return edited;
      } catch (e) {
        return e;
      }
    };
    this.getPetScore = function () {
      if (!data.m.pets) return 0;
      let petScore = 0;
      for (const pet of data.m.pets) {
        petScore += pet_score[pet.tier] || 0;
      }
      return petScore;
    };
    this.stats = (data.m.stats ? {
      purse: Math.floor(data.m.coin_purse) || 0,
      kills: data.m.stats.kills || 0,
      deaths: data.m.stats.deaths || 0,
      highest_crit_damage: Math.round(data.m.stats.highest_crit_damage * 100) / 100 || 0,
      highest_critical_damage: Math.round(data.m.stats.highest_critical_damage * 100) / 100 || 0,
      gifts_given: data.m.stats.gifts_given || 0,
      gifts_received: data.m.stats.gifts_received || 0
    } : null);
  }
}
/**
 * @param {object} data
 *
 * @return {object}
 */
function getSkills (data) {
  const skillsObject = {};
  if (!objectPath.has(data, 'experience_skill_foraging')) {
    if (data.player) {
      for (const [skill, achievement] of Object.entries(skills_achievements)) {
        skillsObject[skill] = getLevelByAchievement(data.player.achievements[achievement], skill);
      }
      skillsObject.usedAchievementApi = true;
      return skillsObject;
    }
    return null;
  }
  for (const skill of skills) {
    skillsObject[skill] = getLevelByXp(data[`experience_skill_${skill}`], skill, data.player ? data.player.achievements : undefined);
  }
  if (data.player) skillsObject.usedAchievementApi = false;
  return skillsObject;
}
/**
 * @param {object} data
 *
 * @return {object}
 */
function getSlayer (data) {
  if (!objectPath.has(data, 'slayer_bosses')) {
    return null;
  }
  return {
    zombie: getSlayerLevel(data.slayer_bosses.zombie),
    spider: getSlayerLevel(data.slayer_bosses.spider),
    wolf: getSlayerLevel(data.slayer_bosses.wolf)
  };
}
/**
 * @param {object} data
 *
 * @return {object}
 */
function getDungeons (data) {
  if (!objectPath.has(data, 'dungeons')) {
    return null;
  }
  return {
    types: {
      catacombs: getLevelByXp(data.dungeons.dungeon_types.catacombs ? data.dungeons.dungeon_types.catacombs.experience : null, 'dungeons')
    },
    classes: {
      healer: getLevelByXp(data.dungeons.player_classes.healer ? data.dungeons.player_classes.healer.experience : null, 'dungeons'),
      mage: getLevelByXp(data.dungeons.player_classes.mage ? data.dungeons.player_classes.mage.experience : null, 'dungeons'),
      berserk: getLevelByXp(data.dungeons.player_classes.berserk ? data.dungeons.player_classes.berserk.experience : null, 'dungeons'),
      archer: getLevelByXp(data.dungeons.player_classes.archer ? data.dungeons.player_classes.archer.experience : null, 'dungeons'),
      tank: getLevelByXp(data.dungeons.player_classes.tank ? data.dungeons.player_classes.tank.experience : null, 'dungeons')
    }
  };
}

module.exports = SkyblockMember;
