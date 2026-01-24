
module.exports = function({ api, models }) {
  const Users = require("./controllers/users")({ models, api }),
      Threads = require("./controllers/threads")({ models, api }),
      Currencies = require("./controllers/currencies")({ models });
  const logger = require("../utils/log.js");
  const fs = require("fs");
  const moment = require('moment-timezone');
  var day = moment.tz("Asia/Ho_Chi_Minh").day();
  var tan = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || DD/MM/YYYY');
  var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
  if (thu == 'Sunday') thu = 'Chủ Nhật'
  if (thu == 'Monday') thu = 'Thứ Hai'
  if (thu == 'Tuesday') thu = 'Thứ Ba'
  if (thu == 'Wednesday') thu = 'Thứ Tư'
  if (thu == "Thursday") thu = 'Thứ Nắm'
  if (thu == 'Friday') thu = 'Thứ Sáu'
  if (thu == 'Saturday') thu = 'Thứ Bảy'
  const axios = require("axios");
  var day = moment.tz("Asia/Ho_Chi_Minh").day();
  const checkttDataPath = __dirname + '/../modules/commands/tt/';
  setInterval(async () => {
    const day_now = moment.tz("Asia/Ho_Chi_Minh").day();
    if (day != day_now) {
      day = day_now;
      const checkttData = fs.readdirSync(checkttDataPath);
      console.log('[ CHECKTT ] - Đang gửi top tương tác');
      checkttData.forEach(async (checkttFile) => {
        const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
        let storage = [], count = 1;
        for (const item of checktt.day) {
          const userName = await Users.getNameUser(item.id) || 'Facebook User';
          const itemToPush = item;
          itemToPush.name = userName;
          storage.push(itemToPush);
        };
        storage.sort((a, b) => {
          if (a.count > b.count) {
            return -1;
          }
          else if (a.count < b.count) {
            return 1;
          } else {
            return a.name.localeCompare(b.name);
          }
        });
        let checkttBody = '[ Top 10 Tương Tác Ngày ]\n\n';
        checkttBody += storage.slice(0, 10).map(item => {
          return `👑 Top: ${count++}\n👤 Tên: ${item.name}\n💬 Tin Nhắn: ${item.count}\n`;
        }).join('\n');
       
        api.sendMessage(`${checkttBody}\n📝 Tương tác để giành top nhé`, checkttFile.replace(".json", ""), (err) => err ? console.log(err) : '');

        checktt.day.forEach(e => {
          e.count = 0;
        });
        checktt.time = day_now;

        fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
      });
      if (day_now == 1) {
        console.log('-> CHECKTT: Tuần Mới');
        checkttData.forEach(async (checkttFile) => {
          const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
          let storage = [], count = 1;
          for (const item of checktt.week) {
            const userName = await Users.getNameUser(item.id) || 'Facebook User';
            const itemToPush = item;
            itemToPush.name = userName;
            storage.push(itemToPush);
          };
          storage.sort((a, b) => {
            if (a.count > b.count) {
              return -1;
            }
            else if (a.count < b.count) {
              return 1;
            } else {
              return a.name.localeCompare(b.name);
            }
          });
          let checkttBody = '[ TOP 15 TƯƠNG TÁC TUẦN ]\n\n';
          checkttBody += storage.slice(0, 15).map(item => {
            return `${count++}. ${item.name} (${item.count})`;
          }).join('\n');
          api.sendMessage(`${checkttBody}\n📝 Tương tác để giành top nhé`, checkttFile.replace('.json', ''), (err) => err ? console.log(err) : '');
          checktt.week.forEach(e => {
            e.count = 0;
          });

          fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
        })
      }
      global.client.sending_top = false;
    }
  }, 1000 * 10);
  /////////////////////////
  //========= Push all variable from database to environment =========//
  //////////////////////////////////////////////////////////////////////

  (async function() {

      try {
          logger(global.getText('listen', 'startLoadEnvironment'), '[ Dữ liệu ]');
          let threads = await Threads.getAll(),
              users = await Users.getAll(['userID', 'name', 'data']),
              currencies = await Currencies.getAll(['userID']);
          for (const data of threads) {
              const idThread = String(data.threadID);
              global.data.allThreadID.push(idThread),
                  global.data.threadData.set(idThread, data['data'] || {}),
                  global.data.threadInfo.set(idThread, data.threadInfo || {});
              if (data['data'] && data['data']['banned'] == !![])
                  global.data.threadBanned.set(idThread,
                      {
                          'reason': data['data']['reason'] || '',
                          'dateAdded': data['data']['dateAdded'] || ''
                      });
              if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0)
                  global['data']['commandBanned']['set'](idThread, data['data']['commandBanned']);
              if (data['data'] && data['data']['NSFW']) global['data']['threadAllowNSFW']['push'](idThread);
          }
          logger.loader(global.getText('listen', 'loadedEnvironmentThread'));
          for (const dataU of users) {
              const idUsers = String(dataU['userID']);
              global.data['allUserID']['push'](idUsers);
              if (dataU.name && dataU.name['length'] != 0) global.data.userName['set'](idUsers, dataU.name);
              if (dataU.data && dataU.data.banned == 1) global.data['userBanned']['set'](idUsers, {
                  'reason': dataU['data']['reason'] || '',
                  'dateAdded': dataU['data']['dateAdded'] || ''
              });
              if (dataU['data'] && dataU.data['commandBanned'] && dataU['data']['commandBanned']['length'] != 0)
                  global['data']['commandBanned']['set'](idUsers, dataU['data']['commandBanned']);
          }
          for (const dataC of currencies) global.data.allCurrenciesID.push(String(dataC['userID']));
          logger.loader(global.getText('listen', 'loadedEnvironmentUser')), logger(global.getText('listen', 'successLoadEnvironment'), '[ Dữ liệu ]');
      } catch (error) {
          return logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
      }
  }());
  logger(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "𝗭𝘆 𝗖𝘂𝘁𝗲" : global.config.BOTNAME}`, "[ Thông tin Bot ]");
  const admin = config.ADMINBOT;
  logger.loader("┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓")
  for (let i = 0; i <= admin.length - 1; i++) {
      dem = i + 1
      logger.loader(`┣➤ID ADMIN ${dem}: ${(!admin[i]) ? "Trống" : admin[i]}`);
  }
  logger.loader(`┣➤ID BOT: ${api.getCurrentUserID()}`)
  logger.loader(`┣➤PREFIX: ${global.config.PREFIX}`)
  logger.loader(`┣➤NAME BOT: ${(!global.config.BOTNAME) ? "This bot was made by VTAN" : global.config.BOTNAME}`)
  logger.loader("┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
  ///////////////////////////////////////////////
  //========= Require all handle need =========//
  //////////////////////////////////////////////

  const handleCommand = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
  const handleCommandEvent = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
  const handleReply = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
  const handleReaction = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
  const handleRefresh = require("./handle/handleRefresh")({ api, Threads, Users, Currencies, models });
  const handleEvent = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
  const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });
  const handleUnsend = require("./handle/handleUnsend")({ api });

  //////////////////////////////////////////////////
  //========= Send event to handle need =========//
  /////////////////////////////////////////////////
  return async (event) => {
      if (event.type == "change_thread_image") api.sendMessage( `🥨 ==== [ CẬP NHẬT NHÓM ] ==== 🥨\n━━━━━━━━━━━━━━━━\n[📢] → ${event.snippet}\n[⏳] → 𝗩𝗮̀𝗼 𝗹𝘂́𝗰 : ${tan} || ${thu}`, event.threadID, event.messageID);
      let form_mm_dd_yyyy = (input = "", split = input.split("/")) =>
          `${split[1]}/${split[0]}/${split[2]}`;
        let prefix =
          (global.data.threadData.get(event.threadID) || {}).PREFIX ||
          global.config.PREFIX;
          
        let send = (msg, callback) =>
          api.sendMessage(msg, event.threadID, callback, event.messageID);
        if (
          (event.body || "").startsWith(prefix) &&
          event.senderID != api.getCurrentUserID() &&
          !global.config.ADMINBOT.includes(event.senderID)
        ) {
          let thuebot;
          try {
            thuebot = JSON.parse(
              require("fs").readFileSync(
                process.cwd() + "/modules/commands/data/thuebot.json"
              )
            );
          } catch {
            thuebot = [];
          }
          let find_thuebot = thuebot.find(($) => $.t_id == event.threadID);
    
          if (!find_thuebot)
            return api.sendMessage(event.threadID, async () => {
              await api.shareContact("⛔ Nhóm của bạn chưa thuê bot, Vui lòng thuê bot để tiếp tục sử dụng.\n\nLiên hệ Admin: Trần Văn Tân", 100091548416971, event.threadID);
            });
          if (
            new Date(form_mm_dd_yyyy(find_thuebot.time_end)).getTime() <=
            Date.now() + 25200000
          )
            return api.sendMessage(event.threadID, async () => {
              await api.shareContact("⚠️ Nhóm của bạn đã hết hạn thuê bot, Vui lòng thanh toán để tiếp tục gia hạn.\n\nLiên hệ Admin: Trần Văn Tân", 100091548416971, event.threadID);
            });
    
        }
      switch (event.type) {
          case "message":
          case "message_reply":
          case "message_unsend":
              handleCreateDatabase({ event });
              handleCommand({ event });
              handleReply({ event });
              handleCommandEvent({ event });

              break;
          case "change_thread_image":
          case "event":
              handleEvent({ event });
              handleRefresh({ event });
              if (event.type != "change_thread_image" && global.config.notiGroup) {
                  var vtan = `\n[💓] → Bây giờ là: ${time}`
                  var msg = `🥨 ==== 「 CẬP NHẬT NHÓM 」 ==== 🥨\n━━━━━━━━━━━━━━━━━━\n[🍒] → `
                  msg += event.logMessageBody
                  if (event.author == api.getCurrentUserID()) {
                      hhh = msg.replace('[🎀] → Bạn ', global.config.BOTNAME)
                  }
                  api.sendMessage(msg + vtan, event.threadID, event.messageID);
              }
              break;
          case "message_reaction":
              handleUnsend({ event });
              handleReaction({ event });
              var { iconUnsend } = global.config
              if (iconUnsend.status && event.senderID == api.getCurrentUserID() && event.reaction == iconUnsend.icon) {
                  api.unsendMessage(event.messageID)
              }
              handleReaction({ event });
              break;
          default:
              break;
      }
  };
};
