const puppeteer = require('puppeteer');


function getNewPrice(ean) {
    return `//div[contains(@data-group-name, "${ean}") and contains(@class, "results-area")]//div[contains(@class, "price-block__highlight")]//meta`
}

function getSecondPrice(ean) {
    return `//div[contains(@data-group-name, "${ean}") and contains(@class, "results-area")]//div[contains(@class, "small_details product-prices medium--is-visible")]//strong`
}

function getImage(ean) {
    return `//div[contains(@data-group-name, "${ean}") and contains(@class, "results-area")]//div[contains(@class, "product-item__image hit-area")]//img`
}

function getBookTitleOrUrl(ean) {
    return `//div[contains(@data-group-name, "${ean}") and contains(@class, "results-area")]//div[contains(@class, "product-title--inline")]//a`
}

function getTotalReviewOrStar(ean) {
    return `//div[contains(@data-group-name, "${ean}") and contains(@class, "results-area")]//div[contains(@class, "star-rating")]`
}

async function searchTextToBol(ean) {
    const browser = await puppeteer.launch(
        {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        }
    );
    const page = await browser.newPage();
    let result = {}
    await page.goto(`https://www.bol.com/nl/nl/s/?searchtext=${ean}`);

    const acceptCookies = await page.$x('//span[contains(text(), "Accepteren")]')
    await acceptCookies[0].click()


    try {
        const [newPrice] = await page.$x(getNewPrice(ean))
        const newPriceText = await page.evaluate(newPrice => newPrice.content, newPrice)

        let secondPriceText = newPriceText

        try {
            const [secondPrice] = await page.$x(getSecondPrice(ean))
            secondPriceText = await page.evaluate(secondPrice => secondPrice.textContent.replace(/€/g, '').replace(',', '.').trim(), secondPrice)
        } catch (DOMException) {
            secondPriceText = undefined
        }

        const [image] = await page.$x(getImage(ean))
        const imageSrc = await page.evaluate(image => image.src, image)

        const [bookTitle] = await page.$x(getBookTitleOrUrl(ean))
        const bookTitleText = await page.evaluate(bookTitle => bookTitle.textContent, bookTitle)

        const [bookUrl] = await page.$x(getBookTitleOrUrl(ean))
        const bookUrlHref = await page.evaluate(bookUrl => bookUrl.href, bookUrl)

        const [totalReviewOrStar] = await page.$x(getTotalReviewOrStar(ean))
        const totalReviewCount = await page.evaluate(totalReview => totalReview.dataset.count, totalReviewOrStar)
        const totalStarCount = await page.evaluate(totalStar => totalStar.title.slice(18, 21).replace(',', '.'), totalReviewOrStar)

        result = {
            'newPrice': parseFloat(newPriceText),
            'secondPrice': parseFloat(secondPriceText),
            'image': imageSrc,
            'bookTitle': bookTitleText,
            'url': bookUrlHref,
            'totalReview': parseInt(totalReviewCount),
            'totalStar': parseFloat(totalStarCount),
            'status': 200
        }
    } catch (DOMException) {
        result = {
            'status': 404
        }
    }

    await browser.close();

    return result
}

module.exports = searchTextToBol