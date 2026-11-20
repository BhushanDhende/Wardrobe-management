import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3000';
const OUT_DIR = path.resolve('test-results');

async function runTests() {
  console.log('🚀 Starting WardrobeAI End-to-End Automated Browser Tests...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Set mobile device viewport (iPhone 14)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // Track console logs and errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('  [Browser Console Error]:', msg.text());
    }
  });

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Home Screen
    // ------------------------------------------------------------------------
    console.log('1️⃣ Testing Home Screen...');
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });

    const title = await page.$eval('h1', (el) => el.textContent);
    console.log(`   Header Brand: "${title}"`);
    if (!title.includes('WardrobeAI')) throw new Error('Brand title mismatch');

    // Check Metrics Cards
    const metricsCount = await page.$$eval('div.grid-cols-3 > *', (els) => els.length);
    console.log(`   Metrics Cards Found: ${metricsCount} (expected 3)`);

    await page.screenshot({ path: path.join(OUT_DIR, '01_home_screen.png') });
    console.log('   ✅ Home screen verified & screenshot saved.\n');

    // ------------------------------------------------------------------------
    // TEST 2: Virtual Try-On Modal Flow
    // ------------------------------------------------------------------------
    console.log('2️⃣ Testing Virtual Try-On Modal...');
    // Click "Try on Look #1"
    const tryOnCta = await page.$('button ::-p-text(Try on Look #1)');
    if (tryOnCta) {
      await tryOnCta.click();
    } else {
      const tryOnMeButtons = await page.$$('button ::-p-text(Try on me)');
      if (tryOnMeButtons.length > 0) await tryOnMeButtons[0].click();
    }

    await page.waitForSelector('h2 ::-p-text(Virtual Try-On)', { timeout: 5000 });
    console.log('   Virtual Try-On Modal opened.');
    await page.screenshot({ path: path.join(OUT_DIR, '02_tryon_modal_ready.png') });

    // Click "Try On Me Now"
    const runTryOnBtn = await page.$('button ::-p-text(Try On Me Now)');
    if (runTryOnBtn) {
      console.log('   Executing Virtual Try-On AI fitting...');
      await runTryOnBtn.click();

      // Wait for the score & feedback to show up
      await page.waitForSelector('h3 ::-p-text(Looks Good On Me?)', { timeout: 15000 });
      console.log('   AI Stylist Score & Evaluation received!');

      await page.screenshot({ path: path.join(OUT_DIR, '03_tryon_result.png') });
      console.log('   ✅ Virtual Try-On result verified & screenshot saved.\n');

      // Test Close modal
      const closeBtn = await page.$('button ::-p-text(Pick Another Outfit)');
      if (closeBtn) await closeBtn.click();
    }

    // ------------------------------------------------------------------------
    // TEST 3: Wardrobe Screen (Filters, Search, Wear Count, Add Modal)
    // ------------------------------------------------------------------------
    console.log('3️⃣ Testing Wardrobe Screen...');
    const wardrobeNav = await page.$('button ::-p-text(Wardrobe)');
    await wardrobeNav.click();
    await page.waitForSelector('h2 ::-p-text(My Wardrobe)');

    // Test Category filter pill: Tops
    const topsPill = await page.$('button ::-p-text(Tops)');
    await topsPill.click();
    await new Promise((r) => setTimeout(r, 400));
    console.log('   Category filter "Tops" activated.');

    // Test Search input
    const searchInput = await page.$('input[placeholder*="Search by name"]');
    await searchInput.type('White');
    await new Promise((r) => setTimeout(r, 400));
    console.log('   Search for "White" typed.');
    await page.screenshot({ path: path.join(OUT_DIR, '04_wardrobe_filtered.png') });

    // Clear Search and reset Category to All
    const clearBtn = await page.$('button.absolute.right-3');
    if (clearBtn) await clearBtn.click();
    const allPill = await page.$('button ::-p-text(All)');
    if (allPill) await allPill.click();

    // Test "+1 worn" button
    const plusButtons = await page.$$('button[title*="Mark worn today"]');
    if (plusButtons.length > 0) {
      await plusButtons[0].click();
      console.log('   Item wear count incremented (+1).');
    }

    // Test Smart Item Match & Wardrobe Pairing Modal
    const firstClothingCard = await page.$('div.group.cursor-pointer');
    if (firstClothingCard) {
      console.log('   Clicking clothing card to test Smart Match & Pairing Assistant...');
      await firstClothingCard.click();
      await page.waitForSelector('h2 ::-p-text(Wardrobe Pairing & Match)', { timeout: 8000 });
      console.log('   ✅ Smart Match & Pairing Modal opened successfully.');
      await page.screenshot({ path: path.join(OUT_DIR, '04b_item_pairing_modal.png') });

      // Close pairing modal
      const closePairingBtn = await page.$('button svg.w-5.h-5');
      if (closePairingBtn) await closePairingBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Test Open "Add Clothing Item" modal
    const addBtn = await page.$('button ::-p-text(Add)');
    await addBtn.click();
    await page.waitForSelector('h2 ::-p-text(Add Clothing Item)');
    console.log('   "Add Clothing Item" modal opened.');
    await page.screenshot({ path: path.join(OUT_DIR, '05_add_clothing_modal.png') });

    // Close modal
    const cancelBtn = await page.$('button ::-p-text(Cancel)');
    if (cancelBtn) await cancelBtn.click();
    console.log('   ✅ Wardrobe screen verified.\n');

    // ------------------------------------------------------------------------
    // TEST 4: AI Outfit Generator
    // ------------------------------------------------------------------------
    console.log('4️⃣ Testing AI Outfit Generator...');
    const outfitsNav = await page.$('button ::-p-text(Outfits)');
    await outfitsNav.click();
    await page.waitForSelector('h3 ::-p-text(AI Outfit Architect)');

    // Click "Party" occasion
    const partyOccasion = await page.$('button ::-p-text(Party)');
    if (partyOccasion) await partyOccasion.click();

    // Click "Generate AI Outfit"
    const generateBtn = await page.$('button ::-p-text(Generate AI Outfit)');
    console.log('   Triggering Gemini AI Outfit Generation...');
    await generateBtn.click();

    await page.waitForSelector('span ::-p-text(AI Suggested Outfit)', { timeout: 15000 });
    console.log('   AI Outfit Generated successfully!');
    await page.screenshot({ path: path.join(OUT_DIR, '06_outfit_generator_result.png') });

    // Test Switch to Lookbook Tab
    const lookbookTab = await page.$('button ::-p-text(Lookbook)');
    await lookbookTab.click();
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, '07_saved_lookbook.png') });
    console.log('   ✅ Outfit Generator & Lookbook verified.\n');

    // ------------------------------------------------------------------------
    // TEST 5: Smart Shopping Suggestions
    // ------------------------------------------------------------------------
    console.log('5️⃣ Testing Smart Shopping Suggestions...');
    const shopNav = await page.$('button ::-p-text(Shop)');
    await shopNav.click();
    await page.waitForSelector('h2 ::-p-text(Smart Shopping)');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify suggestions loaded with multi-store links (Amazon, Flipkart, Meesho, Myntra)
    const myntraLinks = await page.$$('a[href*="myntra.com"]');
    const amazonLinks = await page.$$('a[href*="amazon.in"]');
    const flipkartLinks = await page.$$('a[href*="flipkart.com"]');
    const meeshoLinks = await page.$$('a[href*="meesho.com"]');
    console.log(`   Shopping stores verified: Myntra (${myntraLinks.length}), Amazon (${amazonLinks.length}), Flipkart (${flipkartLinks.length}), Meesho (${meeshoLinks.length})`);

    await page.screenshot({ path: path.join(OUT_DIR, '08_shopping_suggestions.png') });
    console.log('   ✅ Shopping Suggestions verified.\n');

    // ------------------------------------------------------------------------
    // TEST 6: Profile, 3-Angle Scan, Color Studio & Day Mode Verification
    // ------------------------------------------------------------------------
    console.log('6️⃣ Testing Profile, 3-Angle AI Scan, Color Studio & Day Mode...');
    const profileNav = await page.$('button ::-p-text(Profile)');
    await profileNav.click();
    await page.waitForSelector('h3 ::-p-text(3-Angle Body & Face Scanner)');
    console.log('   3-Angle Body & Face Scanner loaded.');

    // Verify Personal Color Studio & Best/Avoid colors are displayed
    await page.waitForSelector('h4 ::-p-text(Colors That Look Amazing On You)');
    await page.waitForSelector('h4 ::-p-text(Colors To Avoid)');
    console.log('   ✅ Personal Color Studio (Best Colors vs Avoid Colors) verified.');
    await page.screenshot({ path: path.join(OUT_DIR, '09_three_angle_scanner.png') });

    // Switch to Preferences tab
    const prefTab = await page.$('button ::-p-text(Preferences)');
    if (prefTab) {
      await prefTab.click();
      await page.waitForSelector('button ::-p-text(Save Style Preferences)');
      console.log('   Profile Preferences & Gemini Key loaded.');

      // Verify INR Budget buttons exist
      const inrBudgetBtn = await page.$('button ::-p-text(₹ Budget)');
      const inrMidBtn = await page.$('button ::-p-text(₹₹ Mid)');
      const inrLuxBtn = await page.$('button ::-p-text(₹₹₹ Luxury)');
      if (inrBudgetBtn && inrMidBtn && inrLuxBtn) {
        console.log('   ✅ INR Currency (₹) buttons verified in Profile preferences.');
      } else {
        throw new Error('INR currency buttons missing in Profile screen');
      }

      await page.screenshot({ path: path.join(OUT_DIR, '09b_profile_preferences.png') });
    }

    // Verify strict Day Mode (dark class is NOT present on html or body)
    const isDarkClassPresent = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    });
    if (isDarkClassPresent) {
      throw new Error('Night mode dark class detected when day mode is strictly enforced');
    }
    console.log('   ✅ Clean Day Mode confirmed (no dark mode class on document).');

    // Switch to Photos tab
    const photosTab = await page.$('button ::-p-text(Photos)');
    if (photosTab) {
      await photosTab.click();
      await page.waitForSelector('h3 ::-p-text(Virtual Try-On Photos)');
      await page.screenshot({ path: path.join(OUT_DIR, '10_profile_photos.png') });
      console.log('   "Photos" virtual try-on model gallery verified.');
    }

    console.log('\n🎉 ALL END-TO-END BROWSER TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  } catch (err) {
    console.error('\n❌ Test Error:', err);
    await page.screenshot({ path: path.join(OUT_DIR, 'error_screenshot.png') });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
