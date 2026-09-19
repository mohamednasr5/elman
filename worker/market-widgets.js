/**
 * Masrawy Live Market Indicators Provider
 * Fetches Gold, Currency, and Weather indicators directly from https://www.masrawy.com/
 * with edge caching and resilient fallbacks.
 */

let memoryCache = null;
let memoryCacheExpiry = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getArabicDateFallback() {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  } catch (_) {
    return 'اليوم';
  }
}

function parsePortSaidWeather(portSaidHtml) {
  if (!portSaidHtml) return null;
  try {
    const highMatch = portSaidHtml.match(/id="spHighTemp"[^>]*>([\d]+)<\/div>/i) || portSaidHtml.match(/class="[^"]*icon-high[^"]*"[^>]*>([\d]+)<\/div>/i);
    const lowMatch = portSaidHtml.match(/id="spLowTemp"[^>]*>([\d]+)<\/div>/i) || portSaidHtml.match(/class="[^"]*icon-low[^"]*"[^>]*>([\d]+)<\/div>/i);
    const humMatch = portSaidHtml.match(/<div\s+class="[^"]*?\bhum\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
    const windMatch = portSaidHtml.match(/<div\s+class="[^"]*?\bwind\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
    const iconMatch = portSaidHtml.match(/class="[^"]*weatherIcon\s+([^"]+)"/i);

    const high = highMatch ? highMatch[1].trim() : '27';
    const low = lowMatch ? lowMatch[1].trim() : '25';
    const rawCond = (iconMatch ? iconMatch[1] : '').toLowerCase();

    const curHour = new Date().getUTCHours() + 3;
    const egyptHour = curHour % 24;
    const isNight = egyptHour >= 18 || egyptHour < 6;

    let condition = isNight ? 'night' : 'sunny';
    let conditionLabel = isNight ? 'صافٍ ليلاً' : 'مشمس صافٍ';

    if (/thunder|storm|برق|رعد/.test(rawCond)) {
      condition = 'thunder';
      conditionLabel = 'عواصف رعدية';
    } else if (/rain|drizzle|shower|مطر|أمطار/.test(rawCond)) {
      condition = 'rain';
      conditionLabel = 'أمطار';
    } else if (/cloud|overcast|غيوم/.test(rawCond) && !/sunny|sun|شمس/.test(rawCond)) {
      condition = 'cloudy';
      conditionLabel = 'غائم بالسحب';
    } else if (/sunnycloud|partly|غائم جزئيا|شمس وسحاب|شمس وسحب/.test(rawCond)) {
      if (isNight) {
        condition = 'cloudyNight';
        conditionLabel = 'سحب ليلية';
      } else {
        condition = 'partlyCloudy';
        conditionLabel = 'شمس وسحب';
      }
    } else if (/clearnight|ليل/.test(rawCond)) {
      condition = 'night';
      conditionLabel = 'صافٍ ليلاً';
    } else if (/clearday|sun|clear|مشمس|صافي/.test(rawCond)) {
      if (isNight) {
        condition = 'night';
        conditionLabel = 'صافٍ ليلاً';
      } else {
        condition = 'sunny';
        conditionLabel = 'مشمس صافٍ';
      }
    }

    return {
      temp: high,
      high,
      low,
      city: 'المنزلة والمطرية',
      humidity: humMatch ? humMatch[1].trim() : '50%',
      wind: windMatch ? windMatch[1].trim() : 'شمال غرب',
      condition,
      conditionLabel
    };
  } catch (err) {
    console.warn('[Port Said Parse Error]:', err);
    return null;
  }
}

function parseMasrawyHtml(html, portSaidHtml = '') {
  const result = {};
  const arabicDateFallback = 'اليوم';

  try {
    // 1. Gold Price Parsing
    const goldHeaderMatch = html.match(/class="FirstLevel gold"[^>]*>[\s\S]*?<span class="icon-temp">([\d.,]+)<\/span>/i);
    let goldPrice = goldHeaderMatch ? goldHeaderMatch[1].replace(/,/g, '').trim() : '';

    const goldSectionMatch = html.match(/<section class="goldCnts">([\s\S]*?)<\/section>/i);
    if (goldSectionMatch) {
      const sectionHtml = goldSectionMatch[1];
      const titleMatch = sectionHtml.match(/<p>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'سعر جرام الذهب عيار 21';
      const karatMatch = title.match(/عيار\s*(\d+)/);
      const karat = karatMatch ? karatMatch[1] : '21';
      const dateMatch = sectionHtml.match(/<p class="date">([\s\S]*?)<\/p>/i);
      const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : arabicDateFallback;

      const priceBoxMatch = sectionHtml.match(/<div class="currPrice">([\s\S]*?)<\/div>/i);
      let priceStr = goldPrice;
      if (priceBoxMatch) {
        const numberMatch = priceBoxMatch[1].match(/([\d,.]+)/);
        if (numberMatch) priceStr = numberMatch[1].replace(/,/g, '');
      }
      const rawPrice = parseFloat(priceStr) || 6330;

      const k24 = Math.round(rawPrice * (24 / 21));
      const k18 = Math.round(rawPrice * (18 / 21));

      result.gold = {
        title,
        karat,
        date,
        price: rawPrice.toString(),
        rawPrice,
        currency: 'جنيه',
        rates: {
          k24: k24.toString(),
          k21: rawPrice.toString(),
          k18: k18.toString()
        }
      };
    }

    // 2. Currency Rates Parsing
    const currencySectionMatch = html.match(/<section class="currCnts">([\s\S]*?)<\/section>/i);
    if (currencySectionMatch) {
      const sectionHtml = currencySectionMatch[1];
      const titleMatch = sectionHtml.match(/<p>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'سعر صرف الدولار مقابل الجنيه المصري';
      const dateMatch = sectionHtml.match(/<p class="date">([\s\S]*?)<\/p>/i);
      const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : arabicDateFallback;

      let priceStr = '';
      const currPriceMatch = sectionHtml.match(/<div class="currPrice">([\s\S]*?)<\/div>/i);
      if (currPriceMatch) {
        const numberMatch = currPriceMatch[1].match(/<span[^>]*class="[^"]*fontRed[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || currPriceMatch[1].match(/([\d.,]+)/);
        if (numberMatch) {
          priceStr = numberMatch[1].replace(/<[^>]+>/g, '').replace(/[^\d.,]/g, '').trim();
        }
      }
      if (!priceStr) {
        const numberMatch = sectionHtml.match(/([\d]+\.[\d]+)/);
        if (numberMatch) priceStr = numberMatch[1];
      }
      const usdPrice = parseFloat(priceStr.replace(/,/g, '')) || 52.14;

      result.currency = {
        title,
        code: 'USD',
        date: date || arabicDateFallback,
        price: usdPrice.toFixed(2),
        rawPrice: usdPrice,
        currency: 'جنيه',
        rates: {
          usd: usdPrice.toFixed(2),
          eur: (usdPrice * 1.09).toFixed(2),
          sar: (usdPrice / 3.75).toFixed(2)
        }
      };
    }

    // 3. Weather Parsing: Try Port Said Weather First (Coastal Lake Manzala)
    const portSaidWeather = parsePortSaidWeather(portSaidHtml);
    if (portSaidWeather) {
      result.weather = portSaidWeather;
    } else {
      // Fallback to Masrawy header / section weather with El Manzala city name
      const weatherHeaderMatch = html.match(/class="FirstLevel weather[^"]*"[\s\S]*?<span class="icon-temp">([\d]+)<\/span>/i);
      const headerTemp = weatherHeaderMatch ? weatherHeaderMatch[1].trim() : '';

      const condClass1 = (html.match(/class="FirstLevel weather\s+([^"]*)"/i)?.[1] || '').toLowerCase();
      const condClass2 = (html.match(/class="weatherIconHeader\s+([^"]*)"/i)?.[1] || '').toLowerCase();
      const condClass3 = (html.match(/class="weatherIcon\s+([^"]*)"/i)?.[1] || '').toLowerCase();
      const allCondText = `${condClass1} ${condClass2} ${condClass3}`;

      const curHour = new Date().getUTCHours() + 3;
      const egyptHour = curHour % 24;
      const isNight = egyptHour >= 18 || egyptHour < 6;

      let condition = isNight ? 'night' : 'sunny';
      let conditionLabel = isNight ? 'صافٍ ليلاً' : 'مشمس صافٍ';

      if (/thunder|storm|برق|رعد/.test(allCondText)) {
        condition = 'thunder';
        conditionLabel = 'عواصف رعدية';
      } else if (/rain|drizzle|shower|مطر|أمطار/.test(allCondText)) {
        condition = 'rain';
        conditionLabel = 'أمطار';
      } else if (/cloud|overcast|غيوم/.test(allCondText) && !/sunny|sun|شمس/.test(allCondText)) {
        condition = 'cloudy';
        conditionLabel = 'غائم بالسحب';
      } else if (/sunnycloud|partly|غائم جزئيا|شمس وسحاب|شمس وسحب/.test(allCondText)) {
        if (isNight) {
          condition = 'cloudyNight';
          conditionLabel = 'سحب ليلية';
        } else {
          condition = 'partlyCloudy';
          conditionLabel = 'شمس وسحب';
        }
      } else if (/clearnight|ليل/.test(allCondText)) {
        condition = 'night';
        conditionLabel = 'صافٍ ليلاً';
      } else if (/sun|clear|مشمس|صافي/.test(allCondText)) {
        if (isNight) {
          condition = 'night';
          conditionLabel = 'صافٍ ليلاً';
        } else {
          condition = 'sunny';
          conditionLabel = 'مشمس صافٍ';
        }
      }

      const weatherSectionMatch = html.match(/<section class="wtrCnts">([\s\S]*?)<\/section>/i);
      const highMatch = weatherSectionMatch ? weatherSectionMatch[1].match(/class="highTemp[^"]*">([\d]+)<\/div>/i) : null;
      const lowMatch = weatherSectionMatch ? weatherSectionMatch[1].match(/class="lowTemp[^"]*">([\d]+)<\/div>/i) : null;
      const humMatch = weatherSectionMatch ? weatherSectionMatch[1].match(/<div\s+class="[^"]*?\bhum\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i) : null;
      const windMatch = weatherSectionMatch ? weatherSectionMatch[1].match(/<div\s+class="[^"]*?\bwind\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i) : null;

      const high = highMatch ? highMatch[1] : (headerTemp || '27');
      const low = lowMatch ? lowMatch[1] : '25';

      result.weather = {
        temp: headerTemp || high,
        high,
        low,
        city: 'المنزلة والمطرية',
        humidity: humMatch ? humMatch[1].trim() : '50%',
        wind: windMatch ? windMatch[1].trim() : 'شمال غرب',
        condition,
        conditionLabel
      };
    }
  } catch (err) {
    console.error('[Masrawy Parse Error]:', err);
  }

  // Fallbacks if any section was missing
  if (!result.gold) {
    result.gold = {
      title: 'سعر جرام الذهب عيار 21',
      karat: '21',
      date: arabicDateFallback,
      price: '6330',
      rawPrice: 6330,
      currency: 'جنيه',
      rates: { k24: '7234', k21: '6330', k18: '5426' }
    };
  }

  if (!result.currency) {
    result.currency = {
      title: 'سعر صرف الدولار مقابل الجنيه المصري',
      code: 'USD',
      date: arabicDateFallback,
      price: '52.14',
      rawPrice: 52.14,
      currency: 'جنيه',
      rates: { usd: '52.14', eur: '56.83', sar: '13.90' }
    };
  }

  if (!result.weather) {
    result.weather = {
      temp: '27',
      high: '27',
      low: '25',
      city: 'المنزلة والمطرية',
      humidity: '50%',
      wind: 'شمال غرب',
      condition: 'sunny',
      conditionLabel: 'مشمس صافٍ'
    };
  }

  return result;
}

export async function handleMarketWidgetsRequest(request, corsHeaders = {}) {
  const now = Date.now();
  if (memoryCache && now < memoryCacheExpiry) {
    return new Response(JSON.stringify({ success: true, data: memoryCache, cached: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=900, stale-while-revalidate=1800'
      }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
    };

    // Parallel fetch: Masrawy homepage (Gold & Currency) + Masrawy Port Said Weather (CityId 79)
    const [masrawyRes, portSaidRes] = await Promise.allSettled([
      fetch('https://www.masrawy.com/', {
        signal: controller.signal,
        headers: reqHeaders,
        cf: { cacheTtl: 900, cacheEverything: true }
      }),
      fetch('https://www.masrawy.com/Weather/GetCityForecastList?cityId=79&countryId=1', {
        signal: controller.signal,
        headers: reqHeaders,
        cf: { cacheTtl: 900, cacheEverything: true }
      })
    ]);

    clearTimeout(timeout);

    let html = '';
    let portSaidHtml = '';

    if (masrawyRes.status === 'fulfilled' && masrawyRes.value && masrawyRes.value.ok) {
      html = await masrawyRes.value.text().catch(() => '');
    }
    if (portSaidRes.status === 'fulfilled' && portSaidRes.value && portSaidRes.value.ok) {
      portSaidHtml = await portSaidRes.value.text().catch(() => '');
    }

    if (html || portSaidHtml) {
      const parsed = parseMasrawyHtml(html, portSaidHtml);
      memoryCache = parsed;
      memoryCacheExpiry = now + CACHE_TTL_MS;

      return new Response(JSON.stringify({ success: true, data: parsed, cached: false }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=600, s-maxage=900, stale-while-revalidate=1800'
        }
      });
    }
  } catch (err) {
    console.warn('[Masrawy Fetch Warning]:', err?.message || err);
  }

  // If fetch failed, return existing memoryCache or fresh fallback
  const fallback = memoryCache || parseMasrawyHtml('', '');
  return new Response(JSON.stringify({ success: true, data: fallback, fallback: true }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
