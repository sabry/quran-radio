/* ============================================================================
   qiraat-data.js — single source of truth for the Muqriʼ app.
   Consolidates reader / rāwī / rumūz data that used to be duplicated inside
   shatibiyya-keys.html, progress-pie.html and shatibiyya-film.html, and adds a
   `mutun` registry so the app can carry more than one matn (Shāṭibiyyah + Durra).

   Loaded by every page via <script src="qiraat-data.js"></script>; it attaches
   a frozen `window.QIRAAT`. Page-specific geometry (map vs. film coordinates)
   stays in each page and is derived from the reader ids here.
   ========================================================================== */
(function (root) {
  'use strict';

  // --- the ten readers (7 of the Shāṭibiyyah + 3 of the Durra) --------------
  // sym / triple = Shāṭibiyyah rumūz for the seven; the Durra three carry their
  // own rumūz, filled once verified from the Durra matn (left null for now).
  const readers = [
    { id:'nafi', matn:'shatibiyya', name:'نافع', full:'نافع بن عبد الرحمن', city:'المدينة', nick:'المدني', sym:'أ', triple:'أبج',
      rawis:[ {id:'qalun', name:'قالون', sym:'ب', full:'عيسى بن مِينا المدني (أبو موسى)'},
              {id:'warsh', name:'ورش',  sym:'ج', full:'عثمان بن سعيد المصري (أبو سعيد)'} ] },
    { id:'ibnkathir', matn:'shatibiyya', name:'ابن كثير', full:'عبد الله بن كثير', city:'مكة', nick:'المكي', sym:'د', triple:'دهز',
      rawis:[ {id:'bazzi',  name:'البزّي', sym:'هـ', full:'أحمد بن محمد البَزّي المكّي (أبو الحسن)'},
              {id:'qunbul', name:'قنبل',  sym:'ز', full:'محمد بن عبد الرحمن المخزومي المكّي (أبو عمر)'} ] },
    { id:'abuamr', matn:'shatibiyya', name:'أبو عمرو', full:'زبّان بن العلاء', city:'البصرة', nick:'البصري', sym:'ح', triple:'حطي',
      rawis:[ {id:'duri_amr', name:'الدوري', sym:'ط', of:'أبي عمرو', full:'حفص بن عمر الدُّوري (أبو عمر)'},
              {id:'susi',     name:'السوسي', sym:'ي', full:'صالح بن زياد السُّوسي (أبو شعيب)'} ] },
    { id:'ibnamir', matn:'shatibiyya', name:'ابن عامر', full:'عبد الله بن عامر', city:'الشام (دمشق)', nick:'اليحصبي', sym:'ك', triple:'كلم',
      rawis:[ {id:'hisham', name:'هشام', sym:'ل', full:'هشام بن عمّار الدمشقي (أبو الوليد)'},
              {id:'ibndhakwan', name:'ابن ذكوان', sym:'م', full:'عبد الله بن أحمد بن ذكوان الدمشقي (أبو عمرو)'} ] },
    { id:'asim', matn:'shatibiyya', name:'عاصم', full:'عاصم بن أبي النجود', city:'الكوفة', nick:'الكوفي', sym:'ن', triple:'نصع',
      rawis:[ {id:'shuba', name:'شعبة', sym:'ص', full:'شعبة بن عيّاش الأسدي الكوفي (أبو بكر)'},
              {id:'hafs',  name:'حفص',  sym:'ع', full:'حفص بن سليمان الأسدي الكوفي (أبو عمر)'} ] },
    { id:'hamza', matn:'shatibiyya', name:'حمزة', full:'حمزة بن حبيب الزيّات', city:'الكوفة', nick:'الزيّات', sym:'ف', triple:'فضق',
      rawis:[ {id:'khalaf_hamza', name:'خلف', sym:'ض', of:'حمزة', full:'خلف بن هشام البزّار البغدادي (أبو محمد)'},
              {id:'khallad',      name:'خلاد', sym:'ق', full:'خلّاد بن خالد الشيباني الكوفي (أبو عيسى)'} ] },
    { id:'kisai', matn:'shatibiyya', name:'الكسائي', full:'علي بن حمزة', city:'الكوفة', nick:'الكسائي', sym:'ر', triple:'رست',
      rawis:[ {id:'abulharith', name:'أبو الحارث', sym:'س', full:'الليث بن خالد البغدادي (أبو الحارث)'},
              {id:'duri_kisai', name:'الدوري', sym:'ت', of:'الكسائي', full:'حفص بن عمر الدُّوري (أبو عمر)'} ] },

    // --- the three of the Durra ----------------------------------------------
    // The Durra has no single-letter rumūz: Ibn al-Jazarī pairs each reader with
    // an aṣl in the seven and only notes where they differ (bayt 7-8). `asl` is
    // that base reader's id; `of` on a rāwī marks a same-name clash with the 7.
    { id:'abujafar', matn:'durra', name:'أبو جعفر', full:'يزيد بن القعقاع المدني', city:'المدينة', nick:'المدني', asl:'nafi',
      rawis:[ {id:'ibnwardan', name:'ابن وردان', full:'عيسى بن وردان المدني (أبو الحارث)'},
              {id:'ibnjammaz', name:'ابن جمّاز', full:'سليمان بن مسلم بن جمّاز المدني (أبو الربيع)'} ] },
    { id:'yaqub', matn:'durra', name:'يعقوب', full:'يعقوب بن إسحاق الحضرمي', city:'البصرة', nick:'الحضرمي', asl:'abuamr',
      rawis:[ {id:'ruways', name:'رويس', full:'محمد بن المتوكل اللؤلؤي البصري (أبو عبد الله)'},
              {id:'rawh',   name:'روح',  full:'روح بن عبد المؤمن الهذلي البصري (أبو الحسن)'} ] },
    { id:'khalaf10', matn:'durra', name:'خلف العاشر', full:'خلف بن هشام البزّار البغدادي', city:'بغداد', nick:'البزّار', asl:'hamza',
      sameAs:'khalaf_hamza',   // the very رواي خلف of Ḥamza in the seven, now an independent reader
      rawis:[ {id:'ishaq', name:'إسحاق', full:'إسحاق بن إبراهيم الوراق المروزي (أبو يعقوب)'},
              {id:'idris', name:'إدريس', full:'إدريس بن عبد الكريم الحداد البغدادي (أبو الحسن)'} ] }
  ];

  // --- Shāṭibiyyah collective rumūz (the group codes) -----------------------
  // members use reader/rāwī display names; note flags a rāwī-level code.
  const groupsShatibiyya = [
    { sym:'سما',  color:'#4CAF7D', members:['نافع','ابن كثير','أبو عمرو'],                     desc:'نافع وابن كثير وأبو عمرو' },
    { sym:'حقّ',  color:'#E8B84B', members:['ابن كثير','أبو عمرو'],                            desc:'ابن كثير وأبو عمرو' },
    { sym:'نفر',  color:'#E0795E', members:['ابن كثير','أبو عمرو','ابن عامر'],                 desc:'ابن كثير وأبو عمرو وابن عامر' },
    { sym:'عمّ',  color:'#6CB7D6', members:['نافع','ابن عامر'],                                desc:'نافع وابن عامر' },
    { sym:'حرمي', color:'#B98BD9', members:['نافع','ابن كثير'],                                desc:'قارئا الحرمين: نافع وابن كثير' },
    { sym:'صحبة', color:'#5BC0B0', members:['شعبة','حمزة','الكسائي'],                           desc:'شعبة وحمزة والكسائي', note:'شعبة راوي عاصم' },
    { sym:'صحاب', color:'#C98BB0', members:['حفص','حمزة','الكسائي'],                            desc:'حفص وحمزة والكسائي', note:'حفص راوي عاصم' },
    { sym:'حصن',  color:'#9CCB6A', members:['نافع','عاصم','حمزة','الكسائي'],                    desc:'نافع والكوفيون' },
    { sym:'ث',    color:'#D98B8B', members:['عاصم','حمزة','الكسائي'],                           desc:'الكوفيون' },
    { sym:'ذ',    color:'#8BA6D9', members:['عاصم','حمزة','الكسائي','ابن عامر'],                desc:'الكوفيون والشامي' },
    { sym:'ظ',    color:'#D9C78B', members:['عاصم','حمزة','الكسائي','ابن كثير'],                desc:'الكوفيون والمكي' },
    { sym:'غ',    color:'#8BD9C0', members:['عاصم','حمزة','الكسائي','أبو عمرو'],                desc:'الكوفيون والبصري' },
    { sym:'ش',    color:'#D98BD0', members:['حمزة','الكسائي'],                                 desc:'حمزة والكسائي' },
    { sym:'خ',    color:'#AAB4BD', members:['ابن كثير','أبو عمرو','ابن عامر','عاصم','حمزة','الكسائي'], desc:'الكل عدا نافع' }
  ];

  // --- the matn registry ----------------------------------------------------
  const mutun = {
    shatibiyya: {
      id:'shatibiyya', name:'حِرز الأماني (الشاطبية)', nameEn:'Ash-Shāṭibiyyah',
      kind:'seven', totalAbyat:1173, introSec:50,
      reciterAr:'د. محمود بن حليم',
      audioUrl:'https://files.a-alqasim.com/audio/Mutoon/MahmudHaleem/0814AsShaatibiyyah_MahmudHaleem.mp3',
      textUrl:'https://surahquran.com/Tajweed/alshatibieah.html',
      readers:['nafi','ibnkathir','abuamr','ibnamir','asim','hamza','kisai'],
      groups:groupsShatibiyya
    },
    durra: {
      id:'durra', name:'الدرة المضية', nameEn:'Ad-Durra al-Muḍiyya',
      kind:'three', totalAbyat:241, meter:'الطويل', introSec:null,
      reciterAr:'د. محمود بن حليم',   // same reciter as the Shāṭibiyyah (a-alqasim mutūn)
      audioUrl:'https://files.a-alqasim.com/audio/Mutoon/MahmudHaleem/0820AdDurrahAlMudeeah_MahmudHaleem.mp3',
      // taḥqīq PDF (al-Qāsim, 241 abyāt); the recitation follows this edition:
      source:'https://files.a-alqasim.com/books/mutoon/082001AdDurrahAlMudeeah.pdf',
      textUrl:'https://shamela.ws/book/7749',   // matn-text source (Zuʿbī edition)
      textData:'./durra-abyat.json',            // 241 abyāt, extracted + validated locally
      readers:['abujafar','yaqub','khalaf10'],
      // No Shāṭibiyyah-style collective codes; the Durra works off each reader's aṣl.
      rumuzMethod:'asl', groups:[]
    }
  };

  // --- helpers --------------------------------------------------------------
  const byId   = id => readers.find(r => r.id === id);
  const byName = nm => readers.find(r => r.name === nm);
  const forMatn = mid => mutun[mid].readers.map(byId);

  root.QIRAAT = Object.freeze({
    readers, mutun,
    groups: groupsShatibiyya,      // back-compat alias (Shāṭibiyyah codes)
    byId, byName, forMatn
  });
})(typeof window !== 'undefined' ? window : globalThis);
