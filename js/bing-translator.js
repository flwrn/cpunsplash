const puppeteer = require('puppeteer')
const url = require('url')


let browser = null
let page = null
let input = null
let output = null
let translateResolve = null
let runResolve = null

module.exports = {
  // browser: browser,
  // page: page,
  // input: input,
  // output: output,
  // translateResolve: translateResolve,
  run: run,
  translate: translate
}

async function translate(text) {
  console.log(`translating ${text}`)
  return new Promise(async (resolve) => {
    if (text === '') {
      resolve('')
    }
    translateResolve = resolve
    await input.focus()
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await page.keyboard.type(text)
  })
}


async function run() {
  return new Promise(async (resolve) => {
    browser = await puppeteer.launch({
      // headless: false,
      executablePath: '/usr/bin/chromium'
    })
    page = await browser.newPage()

    page.on('response', async (res) => {
      let parsedURL = url.parse(res.url(), true)
      if (parsedURL.pathname === '/ttranslate') {
        let json = await res.json()
        translateResolve(json.translationResponse)
        console.log(`as ${json.translationResponse}`)
      }
    })

    page.on('load', async () => {
      input = await page.$('.t_txtblkin textarea')
      output = await page.$('.t_txtblkout textarea')
      console.log('translator load finished')
      resolve()


      // console.log(await translate('蓝色'))
    })
    await page.goto('https://cn.bing.com/translator')
  })
}

// run()
