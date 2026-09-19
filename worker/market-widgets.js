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

function parseMasrawyHtml(html) {
  const arabicDateFallback = getArabicDateFallback();
  const result = {
    updatedAt: new Date().toISOString(),
    source: 'https://www.masrawy.com',
    gold: null,
    currency: null,
    weather: null
  };

  try {
    // 1. Gold Parsing
    const goldSectionMatch = html.match(/<section class="goldCnts">([\s\S]*?)<\/section>/i);
    if (goldSectionMatch) {
      const sectionHtml = goldSectionMatch[1];
      const titleMatch = sectionHtml.match(/<p>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim() : 'سعر جرام الذهب عيار 21';
      
      const dateMatch = sectionHtml.match(/<p>[\s\S]*?<\/p>\s*<p>([\s\S]*?)<\/p>/i);
      const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : arabicDateFallback;

      const numberMatch = sectionHtml.match(/<div class="number">([\s\S]*?)<\/div>/i);
      let priceStr = '';
      if (numberMatch) {
        priceStr = numberMatch[1].replace(/<[^>]+>/g, '').replace(/[^\d.,]/g, '').trim();
      }
      const p21 = parseFloat(priceStr.replace(/,/g, '')) || 6330;

      result.gold = {
        title,
        karat: '21',
        date: date || arabicDateFallback,
        price: p21.toLocaleString('ar-EG'),
        rawPrice: p21,
        currency: 'جنيه',
        rates: {
          k24: Math.round(p21 * (24 / 21)).toLocaleString('ar-EG'),
          k21: p21.toLocaleString('ar-EG'),
          k18: Math.round(p21 * (18 / 21)).toLocaleString('ar-EG')
        }
      };
    }

    // 2. Currency Parsing
    const currSectionMatch = html.match(/<section class="currCnts">([\s\S]*?)<\/section>/i);
    if (currSectionMatch) {
      const sectionHtml = currSectionMatch[1];
      const titleMatch = sectionHtml.match(/<p>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : 'سعر صرف الدولار مقابل الجنيه المصري';

      const dateMatch = sectionHtml.match(/<p>[\s\S]*?<\/p>\s*<p>([\s\S]*?)<\/p>/i);
      const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : arabicDateFallback;

      const numberMatch = sectionHtml.match(/<div class="number">([\s\S]*?)<\/div>/i);
      let priceStr = '';
      if (numberMatch) {
        priceStr = numberMatch[1].replace(/<[^>]+>/g, '').replace(/[^\d.,]/g, '').trim();
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

    // 3. Weather Parsing
    const weatherHeaderMatch = html.match(/class="FirstLevel weather[^"]*"[\s\S]*?<span class="icon-temp">([\d]+)<\/span>/i);
    const headerTemp = weatherHeaderMatch ? weatherHeaderMatch[1].trim() : '';

    // Weather condition extraction from Masrawy classes
    const condClass1 = (html.match(/class="FirstLevel weather\s+([^"]*)"/i)?.[1] || '').toLowerCase();
    const condClass2 = (html.match(/class="weatherIconHeader\s+([^"]*)"/i)?.[1] || '').toLowerCase();
    const condClass3 = (html.match(/class="weatherIcon\s+([^"]*)"/i)?.[1] || '').toLowerCase();
    const allCondText = `${condClass1} ${condClass2} ${condClass3}`;

    let condition = 'sunny';
    let conditionLabel = 'مشمس';

    if (/thunder|storm|برق|رعد/.test(allCondText)) {
      condition = 'thunder';
      conditionLabel = 'عواصف رعدية';
    } else if (/rain|drizzle|shower|مطر|أمطار/.test(allCondText)) {
      condition = 'rain';
      conditionLabel = 'ممطر';
    } else if (/sunnycloud|partly|غائم جزئيا|شمس وسحاب/.test(allCondText)) {
      condition = 'partlyCloudy';
      conditionLabel = 'شمس وسحب';
    } else if (/cloud|overcast|غائم|سحاب|غيوم/.test(allCondText)) {
      condition = 'cloudy';
      conditionLabel = 'غائم بالسحب';
    } else if (/sun|clear|مشمس|صافي/.test(allCondText)) {
      condition = 'sunny';
      conditionLabel = 'مشمس صافٍ';
    } else {
      const curHour = new Date().getUTCHours() + 3; // Egypt Time (UTC+3)
      const egyptHour = curHour % 24;
      if (egyptHour >= 19 || egyptHour < 6) {
        condition = 'night';
        conditionLabel = 'صافٍ ليلاً';
      } else {
        condition = 'sunny';
        conditionLabel = 'مشمس';
      }
    }

    const weatherSectionMatch = html.match(/<section class="wtrCnts">([\s\S]*?)<\/section>/i);
    if (weatherSectionMatch) {
      const sectionHtml = weatherSectionMatch[1];
      
      const cityMatch = sectionHtml.match(/<span class="city">([\s\S]*?)<\/span>/i);
      const countryMatch = sectionHtml.match(/<span class="country">([\s\S]*?)<\/span>/i);
      const city = `${cityMatch ? cityMatch[1].replace(/<[^>]+>/g, '').trim() : 'القاهرة'} ${countryMatch ? countryMatch[1].replace(/<[^>]+>/g, '').trim() : 'مصر'}`.trim();

      const highMatch = sectionHtml.match(/class="highTemp[^"]*">([\d]+)<\/div>/i);
      const lowMatch = sectionHtml.match(/class="lowTemp[^"]*">([\d]+)<\/div>/i);

      const humMatch = sectionHtml.match(/<div\s+class="[^"]*?\bhum\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
      const windMatch = sectionHtml.match(/<div\s+class="[^"]*?\bwind\b[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);

      const high = highMatch ? highMatch[1] : (headerTemp || '34');
      const low = lowMatch ? lowMatch[1] : '25';

      result.weather = {
        temp: headerTemp || high,
        high,
        low,
        city: city || 'القاهرة - مصر',
        humidity: humMatch ? humMatch[1].trim() : '38%',
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
      temp: '34',
      high: '34',
      low: '25',
      city: 'القاهرة - مصر',
      humidity: '38%',
      wind: 'شمال غرب',
      condition: 'sunny',
      conditionLabel: 'مشمس'
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

    const res = await fetch('https://www.masrawy.com/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      },
      cf: {
        cacheTtl: 900,
        cacheEverything: true
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const parsed = parseMasrawyHtml(html);
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
  const fallback = memoryCache || parseMasrawyHtml('');
  return new Response(JSON.stringify({ success: true, data: fallback, fallback: true }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
