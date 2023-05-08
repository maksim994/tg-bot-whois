import { Telegraf } from 'telegraf';
import { Markup } from "telegraf";
import dig from 'node-dig-dns';
import sslDateChecker from 'ssl-date-checker';

import config from 'config';
import whoiser from 'whoiser';
import punycode from 'punycode';

const bot = new Telegraf( config.get('TELEGRAM_TOKEN') );

// bot.command('start', async (ctx) => {
//   ctx.telegram.getChatMember('@web_toweb', ctx.chat.id).then(
//     s => {
//       if (s.status == "left") {
//         ctx.telegram.sendMessage(ctx.chat.id, 'Ты не подписан');
//       } else {
//         ctx.reply('Ура ты подписан');
//       }
//     }
//   )
// })


bot.command('whois', async (ctx) => {
  (async () => {
    let text = ctx.message.text;
    let domains = text.replace('/whois', '');
    
    domains = domains.replace('http://', '');
    domains = domains.replace('https://', '');
    domains = domains.replace('/', '');
    // domains = domains.replace(' ', '');

    console.log(domains);


    domains = punycode.toASCII(domains);
    console.log(domains);

    // domains = "xn--80apmtd.xn--p1ai";

    try {

      if (domains == ''){
        return ctx.replyWithHTML('<b>Необходимо указать домен</b>\nНапример: /whois mvmolkov.ru');
      }
      let domainName = domains.trim();
    
      const domainWhois = await whoiser(domainName, { follow: 1 })
      const firstDomainWhois = whoiser.firstResult(domainWhois)
      const firstTextLine = (firstDomainWhois.text[0] || '').toLowerCase()
    
      let domainAvailability = 'unknown'
    
      if (firstTextLine.includes('reserved')) {
        domainAvailability = 'reserved'
      } else if (firstDomainWhois['Domain Name'] && firstDomainWhois['Domain Name'].toLowerCase() === domainName) {
        domainAvailability = 'registered'
      } else if (firstTextLine.includes(`no match for "${domainName}"`)) {
        domainAvailability = 'available'
      }
    
      // console.log(`Domain "${domainName}" is "${domainAvailability}"`)
    
      if (domainAvailability === 'registered') {
        // console.log('Domain was registered on', firstDomainWhois['Created Date'], 'at', firstDomainWhois.Registrar)
        // console.log('Registration will expire on', firstDomainWhois['Expiry Date'])
        // console.log('Domain uses name servers:', firstDomainWhois['Name Server'])
      } else if (domainAvailability === 'available') {
        // console.log('This domain is available for registration right now')
      }
  
    
      // await ctx.reply(JSON.stringify(firstDomainWhois['Name Server'], null, 2));
  
      let textMessage = '';
  
      console.log(domainAvailability);
  
      if ( domainAvailability == "available" || domainAvailability == "unknown") {
        textMessage = 'Домен: ' + domainName + ' доступен для регистрации прямо сейчас ';
  
        ctx.reply(textMessage, 
         {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            Markup.button.url("✅ Зарегистрировать", `https://beget.com/ru/domains/search/${domainName}#search-form-section`),
            // Markup.button.callback("Italic", "italic"),
          ]),
         });
  
      } else {
  
        textMessage = domainName + '\n\n';
      
        firstDomainWhois['Name Server'].forEach((ns) => {
          textMessage += 'NS: ' + ns + '\n';
        });
  
        firstDomainWhois['Domain Status'].forEach((state) => {
          textMessage += 'state: ' + state + '\n';
        });
  
        textMessage += 'person: ' + firstDomainWhois.person + '\n';
        textMessage += 'registrar: ' + firstDomainWhois.Registrar + '\n';
        textMessage += 'admin-contact: ' + firstDomainWhois['admin-contact'] + '\n';
        textMessage += 'created: ' + firstDomainWhois['Created Date'] + '\n';
        textMessage += 'paid-till: ' + firstDomainWhois['Expiry Date'] + '\n';
        textMessage += 'free-date: ' + firstDomainWhois['free-date'] + '\n';  
        textMessage += 'source: ' + firstDomainWhois.source + '\n';
  
        await ctx.reply(textMessage);
      }
    
    } catch (err) {
      console.log('Error:', err);
      ctx.reply('Произошла какая то ошибка, попробуйте ввести по другому');
    }
    


    
    
    

  
  })();
  
  // await ctx.reply(JSON.stringify(results.expirationDate, null, 2));
});

bot.command('dig', async (ctx) => {
  (async () => {
    let text = ctx.message.text;
    let resText = '';
    let domains = text.replace('/dig', '');
    
    domains = domains.replace('http://', '');
    domains = domains.replace('https://', '');
    domains = domains.replace('/', '');

    try {

      if (domains == ''){
        return ctx.replyWithHTML('<b>Необходимо указать домен</b>\nНапример: /dig mvmolkov.ru');
      }

      let domainName = domains.trim();

      dig([domainName, 'ANY'])
      .then((result) => {
        // console.log(result)
        result['answer'].forEach(el => {
          // console.log(el.domain);
          resText += "domain: " + el.domain + "\n";
          resText += "type: " + el.type + "\n";
          resText += "ttl: " + el.ttl + "\n";
          resText += "class: " + el.class+ "\n";
          
          if (el.type == 'MX') {
            resText += "priority: " + el.value.priority+ "\n";
            resText += "server: " + el.value.server+ "\n";
          } else {
            resText += "value: " + el.value + "\n";
          }
          
          resText += "\n";
        })
        return ctx.replyWithHTML(resText);
      })
      .catch((err) => {
        console.log('Error:', err);
      });
      
    
    } catch (err) {
      console.log('Error:', err);
      ctx.reply('Произошла какая то ошибка, попробуйте ввести по другому');
    }
  })();
  
});

bot.command('ssl', async (ctx) => {
  (async () => {
    let text = ctx.message.text;
    let resText = '';
    let domains = text.replace('/ssl', '');
    
    domains = domains.replace('http://', '');
    domains = domains.replace('https://', '');
    domains = domains.replace('/', '');

    try {

      if (domains == ''){
        return ctx.replyWithHTML('<b>Необходимо указать домен</b>\nНапример: /ssl mvmolkov.ru');
      }

      let domainName = domains.trim();

      sslDateChecker(domainName)
      .then((result) => {
        console.log(result)
        
        // return ctx.replyWithHTML(resText);
      })
      .catch((err) => {
        console.log('Error:', err);
      });
      
    
    } catch (err) {
      console.log('Error:', err);
      ctx.reply('Произошла какая то ошибка, попробуйте ввести по другому');
    }
  
  })();
  
});



bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));