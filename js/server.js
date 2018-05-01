const puppeteer = require('puppeteer')
const http = require('http')
const url = require('url')
const translator = require('./bing-translator.js')
// console.log(translate)

let browser = null
let page = null
let response = null
// let results = null
let interval = null
let searchForResolve = null
let getMoreResolve = null

async function searchFor(keyword) {
  return new Promise(async (resolve) => {
    // keyword = keyword.replace(/ /g, '-')
    // let imgPage = 'imgPage???'
    // page.on('request', onSearchRequest)
    searchForResolve = resolve
    page.on('response', onSearchResponse)
    let searchKeyword = await page.$('#searchKeyword')
    await searchKeyword.focus()
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await page.keyboard.type(keyword)
  })
}

async function onSearchResponse(res) {
  let parsedURL = url.parse(res.url(), true)
  if (parsedURL.pathname === '/napi/search') {
    let json = await res.json()
    let results = extractData(json.photos.results)
    // console.log(results.length)
    page.removeListener('response', onSearchResponse)
    searchForResolve(results)
  }
}

function extractData(results) {
  return results.map((item) => {
    return {
      id: item.id,
      link: item.links.html,
      raw: item.urls.raw,
      full: item.urls.full,
      small: item.urls.small,
      username: item.user.name,
      width: item.width,
      height: item.height
    }
  })
}

async function getMore() {
  return new Promise(async (resolve) => {
    getMoreResolve = resolve
    page.on('request', onGetMoreRequest)
    page.on('response', onGetMoreResponse)
    startScroll(50, 50)
  })
}

function startScroll(distance, time) {
  interval = setInterval(() => {
    page.evaluate((distance) => {
      window.scrollBy(0, distance)
    }, distance)
  }, time)
}

function stopScroll() {
  clearInterval(interval)
}

async function onGetMoreRequest(req) {
  let parsedURL = url.parse(req.url(), true)
  if (parsedURL.pathname === '/napi/search/photos') {
    stopScroll()
    page.removeListener('request', onGetMoreRequest)
  }
}

async function onGetMoreResponse(res) {
  let parsedURL = url.parse(res.url(), true)
  if (parsedURL.pathname === '/napi/search/photos') {
    let json = await res.json()
    let results = extractData(json.results)
    // console.log(results.length)
    page.removeListener('response', onGetMoreResponse)
    getMoreResolve(results)
  }
}

function respond(res, code ,body) {
  res.writeHead(code, {
    'Access-Control-Allow-Origin': '*'
  })
  if (code === 200) {
    res.end(body)
  } else {
    res.end()
  }
}


async function run() {
  browser = await puppeteer.launch({
    // headless: false,
    executablePath: '/usr/bin/chromium'
  })
  page = await browser.newPage()


  const server = http.createServer(async (req, res) => {
    let parsedURL = url.parse(req.url, true)
    let results = null
    switch (parsedURL.pathname) {
      case '/search':
      let keyword = parsedURL.query.q
      console.log(`keyword is: ${keyword}`)
      keyword = await translator.translate(keyword)
      results = await searchFor(keyword)
      respond(res, 200, JSON.stringify(results))

      case '/more':
      results = await getMore()
      respond(res, 200, JSON.stringify(results))

      default:
      respond(res, 404)
    }
  }).listen(4000)

  page.on('load', async () => {
    console.log('server load finished')
    await translator.run()


    console.log(await translator.translate('蓝色'))
  })
  await page.goto(`https://unsplash.com/search/photos/wallpaper`)
}
run()
