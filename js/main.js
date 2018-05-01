let header = document.querySelector('.header')
let cols = document.querySelectorAll('.col')
let grid = document.querySelector('.grid')
let backToTop = document.querySelector('.back-to-top')
let search = document.querySelector('.search')
let pics = []
let isGetMorePending = false
document.addEventListener('scroll', () => {
  if (grid.getBoundingClientRect().top <= -350) {
    header.classList.add('down')
    search.classList.add('down')
  } else {
    header.classList.remove('down')
    search.classList.remove('down')
  }
  if (grid.getBoundingClientRect().top <= -700) {
    backToTop.classList.add('shown')
  } else {
    backToTop.classList.remove('shown')
  }
  if (
    getShortestCol(cols).getBoundingClientRect().bottom <= window.innerHeight+3000 &&
    !isGetMorePending
  ) {
    getMore()
    console.log('more getMore')
  }
})
backToTop.addEventListener('click', () => {
  // window.scrollTo(0, 0)
  scrollToTop({
    time: 200,
    exponent: 2,
    interval: 2,
  })
  // scrollToTopFinal({
  //   time: 200,
  //   exponent: 2,
  //   interval: 2,
  //   final: 350
  // })
})
search.addEventListener('keydown', (event) => {
  if (event.keyCode === 13) {
    searchFor(search.value)
  }
})

function scrollToTop(option) {
  let distance = -(document.body.getBoundingClientRect().top)
  let slope = distance / Math.pow(option.time, option.exponent)
  let x = 0
  let scrollInterval = setInterval(() => {
    if (x < option.time) {
      window.scrollTo(0, slope * Math.pow(option.time-x, option.exponent))
      x += option.interval
    } else {
      clearInterval(scrollInterval)
    }
  }, option.interval)
}

// y = slope * Math.pow(2000-x, 2)
// distance = slope * Math.pow(2000, 2)


function scrollToTopFinal(option) {
  let distance = -(document.body.getBoundingClientRect().top)
  let slope1 = (distance - option.final) / (option.time/2)
  let slope2 = option.final / Math.pow(option.time/2, option.exponent)
  let x = 0
  let scrollInterval = setInterval(() => {
    if (x < option.time/2) {
      window.scrollTo(0, slope1 * (option.time/2 - x) + option.final)
      x += option.interval
    } else if (x < option.time) {
      window.scrollTo(0, slope2 * Math.pow(option.time - x, option.exponent))
      x += option.interval
    } else {
      clearInterval(scrollInterval)
    }
  }, option.interval)
}

// (0, distance)
// (1000, 150)
// (2000, 0)

// y-150 = slope1 * (1000-x)
// distance-150 = slope1 * (1000)

// y = slope2 * Math.pow(2000-x, 2)
// 150 = slope2 * Math.pow(1000, 2)

function searchFor(keyword) {
  let xhr = new XMLHttpRequest()
  xhr.onload = function() {
    if (xhr.status === 200) {
      let results = JSON.parse(xhr.responseText)
      clearCols(cols)
      isGetMorePending = false
      appendElements(resultsToElements(results))
    }
  }
  xhr.open('GET', `http://localhost:4000/search?q=${keyword}`, true)
  xhr.send()
}

function clearCols(cols) {
  for (let i=0; i<cols.length; i++) {
    cols[i].innerHTML = ''
  }
}

function getImgHeight(colWidth, trueWidth, trueHeight) {
  return colWidth * trueHeight / trueWidth
}

function getColHeight(col) {
  // return window.getComputedStyle(col).height
  return col.getBoundingClientRect().height
  console.log('get col height')
}

function getShortestCol(cols) {
  let shortestCol = cols[0]
  for (let i=1; i<cols.length; i++) {
    if (getColHeight(cols[i]) < getColHeight(shortestCol)) {
      shortestCol = cols[i]
    }
  }
  console.log('get shortest col')
  return shortestCol
}

function getElementFromItem(item) {
  let holder = document.createElement('div')
  holder.innerHTML = `
  <a
    class="img"
    data-id="${item.id}"
    title="by ${item.username}"
    href="${item.link}"
    style="height:${getImgHeight(380, item.width, item.height)}px;background:#333;"
  >
    <img src="${item.small}">
  </a>
  `
  console.log('get element from item')
  return holder.querySelector('a')
}

function resultsToElements(results) {
  console.log('results to elements')
  return results.map((item) => {
    return getElementFromItem(item)
  })
}

function appendElements(elements) {
  for (let i=0; i<elements.length; i++) {
    getShortestCol(cols).appendChild(elements[i])
  }
  console.log('append elements')
}

function getMore() {
  isGetMorePending = true
  let xhr = new XMLHttpRequest()
  xhr.onload = function() {
    if (xhr.status === 200) {
      let results = JSON.parse(xhr.responseText)
      appendElements(resultsToElements(results))
      isGetMorePending = false
    }
  }
  xhr.open('GET', 'http://localhost:4000/more', true)
  xhr.send()
}
