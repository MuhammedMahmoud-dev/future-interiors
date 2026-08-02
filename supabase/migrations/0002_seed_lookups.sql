-- Future Interiors — lookup + structural content seed
--
-- This seeds ONLY content that is fixed by the spec itself: the six execution
-- stages, the six service categories, and the FAQ topics.
--
-- Deliberately NOT seeded (must stay empty until filled with real data):
--   projects · project_media · site_stats · testimonials · engineer_profile
-- The public site hides those sections entirely while they are empty.
--
-- Wording here is a first draft derived from the spec — review and edit it.

-- ---------------------------------------------------------------- stages

insert into stages (name_ar, name_en, order_index) values
  ('تأسيس',           'Rough-in',          1),
  ('محارة',           'Plastering',        2),
  ('سيراميك',         'Tiling',            3),
  ('جبس بورد',        'Gypsum board',      4),
  ('نقاشة',           'Painting',          5),
  ('تشطيبات نهائية',  'Final finishes',    6);

-- ---------------------------------------------------------------- services

insert into services (title_ar, title_en, desc_ar, desc_en, bullets_ar, bullets_en, icon, order_index) values
  ('تأسيس', 'Rough-in',
   'تأسيس الكهرباء والسباكة من الصفر بمواسير ومسارات مدروسة قبل أي تشطيب.',
   'Electrical and plumbing rough-in laid out from scratch before any finishing work.',
   array['تأسيس كهرباء ولوحات توزيع', 'تأسيس سباكة وصرف', 'مسارات تكييف', 'اختبار ضغط قبل التغطية'],
   array['Electrical rough-in and distribution boards', 'Plumbing and drainage rough-in', 'HVAC routing', 'Pressure testing before closing'],
   'rough-in', 1),

  ('محارة وأرضيات', 'Plastering & screed',
   'ضبط الحوائط والأرضيات بميزان الليزر عشان كل اللي بعدها يركب مظبوط.',
   'Walls and floors levelled with a laser so every later trade lands square.',
   array['محارة بالليزر', 'ضبط الزوايا والفتحات', 'صبة الأرضيات', 'عزل المناطق الرطبة'],
   array['Laser-guided plastering', 'Squaring corners and openings', 'Floor screed', 'Wet-area waterproofing'],
   'plaster', 2),

  ('سيراميك ورخام', 'Tiling & marble',
   'تركيب الأرضيات والحوائط بتوزيع مدروس يقلل الهدر ويضبط خطوط الفواصل.',
   'Floor and wall tiling set out to cut waste and keep joint lines true.',
   array['سيراميك وبورسلين', 'رخام أرضيات ودرج', 'تجهيز الحمامات والمطبخ', 'ضبط فواصل ومناسيب'],
   array['Ceramic and porcelain', 'Marble floors and stairs', 'Bathroom and kitchen prep', 'Joint and level control'],
   'tiling', 3),

  ('جبس بورد', 'Gypsum board',
   'أسقف وديكورات جبس بورد بإضاءة مخفية متوافقة مع تأسيس الكهرباء.',
   'Gypsum ceilings and features with cove lighting coordinated with the electrical rough-in.',
   array['أسقف معلقة', 'بيوت نور وإضاءة مخفية', 'ديكورات حوائط', 'تجهيز أماكن السبوتات'],
   array['Suspended ceilings', 'Cove and concealed lighting', 'Wall features', 'Spotlight cut-outs'],
   'gypsum', 4),

  ('دهانات', 'Painting',
   'معجون ودهانات بطبقات كاملة مع تجهيز السطح، مش طبقة واحدة على السريع.',
   'Full putty and paint build-up with proper surface prep, not a single quick coat.',
   array['معجون وسنفرة', 'سيلر وأساس', 'دهانات بلاستيك وزيت', 'دهانات وديكورات خاصة'],
   array['Putty and sanding', 'Sealer and primer', 'Emulsion and oil paint', 'Specialty decorative finishes'],
   'paint', 5),

  ('تشطيبات نهائية', 'Final finishes',
   'تركيب الأطقم والأبواب والمطابخ وتسليم الشقة جاهزة للسكن.',
   'Fixtures, doors, kitchens and joinery installed and the unit handed over ready to live in.',
   array['أطقم حمامات وخلاطات', 'أبواب وشبابيك', 'مطابخ ودواليب', 'تركيب إنارة وتسليم'],
   array['Sanitary ware and mixers', 'Doors and windows', 'Kitchens and wardrobes', 'Light fitting and handover'],
   'finishes', 6);

-- ---------------------------------------------------------------- faqs
-- No figures, rates, or price-per-metre anywhere in these answers.

insert into faqs (question_ar, question_en, answer_ar, answer_en, order_index) values
  ('إزاي بتتحدد التكلفة النهائية؟',
   'How is the final cost determined?',
   'التكلفة النهائية بتتبني على التكلفة الفعلية للخامات والعمالة زي ما اتصرفت بالظبط، مش رقم مقطوع متحدد من الأول. كل بند بيتسجل بتاريخه وبيظهر في كشف حساب مشروعك أول بأول. تقدر تشوف تفاصيل الطريقة في صفحة نظام العمل.',
   'The final cost is built from the actual money spent on materials and labour, not a lump sum fixed up front. Every line item is logged with its date and appears in your project statement as it happens. The work system page explains the method in full.',
   1),

  ('أقدر أتابع الفواتير أول بأول؟',
   'Can I follow the invoices as they happen?',
   'أيوة. كل بند بيتسجل في صفحة متابعة خاصة بمشروعك بتفتحها بكود خاص بيك، وبتلاقي فيها البنود والدفعات وصور مراحل التنفيذ محدّثة، من غير ما تستنى كشف حساب ورقي في آخر الشهر.',
   'Yes. Every line item is logged on a tracking page specific to your project, opened with your own code. You see items, payments and stage photos as they are updated, without waiting for a paper statement at month end.',
   2),

  ('الخامات بتتشترى باسم مين؟',
   'Whose name are the materials bought in?',
   'الخامات بتتشترى باسمك إنت ومن الموردين مباشرة، وكل فاتورة بتوصلك. ده معناه إن الأسعار اللي بتتحاسب عليها هي أسعار السوق الحقيقية اللي إنت شايفها بنفسك.',
   'Materials are bought in your name, directly from suppliers, and every invoice reaches you. That means the prices you are charged are the real market prices you can see for yourself.',
   3),

  ('مين المشرف على الشغل يومياً؟',
   'Who supervises the work day to day?',
   'الإشراف الهندسي اليومي مسؤولية المهندس محمود الحديدي شخصياً — متابعة الفنيين، مراجعة جودة كل مرحلة قبل ما اللي بعدها تبدأ، وتوثيق التنفيذ بالصور.',
   'Day-to-day engineering supervision is Eng. Mahmoud El-Hadidy''s own responsibility — following the trades, checking the quality of each stage before the next begins, and documenting the work in photos.',
   4),

  ('التنفيذ بياخد قد إيه؟',
   'How long does execution take?',
   'المدة بتختلف حسب مساحة الوحدة ومستوى التشطيب ونطاق الشغل المطلوب. بعد المعاينة بتستلم جدول زمني بمراحل واضحة وتاريخ متوقع لكل مرحلة، وبتقدر تتابع تقدم كل مرحلة من صفحة المتابعة.',
   'It varies with the unit''s area, the finishing level and the scope of work. After the site visit you receive a schedule with clear stages and an expected date for each, and you can follow each stage''s progress from the tracking page.',
   5),

  ('فيه ضمان بعد التسليم؟',
   'Is there a warranty after handover?',
   'أيوة، فيه فترة ضمان على أعمال التنفيذ بتتحدد وتتكتب في الاتفاق قبل بداية الشغل، بتغطي عيوب التنفيذ. الخامات نفسها بيغطيها ضمان الشركة المنتجة والفواتير باسمك فبتقدر ترجعلهم مباشرة.',
   'Yes. A warranty period on the execution work is agreed and written into the contract before work starts, covering workmanship defects. The materials themselves are covered by their manufacturer''s warranty, and since the invoices are in your name you can go back to them directly.',
   6),

  ('الدفع بيكون على دفعات؟',
   'Are payments made in instalments?',
   'أيوة، الدفع بيكون على دفعات مربوطة بمراحل التنفيذ مش دفعة واحدة. كل دفعة بتتسجل بتاريخها في كشف حساب مشروعك، وبتشوف في أي وقت إجمالي اللي اتدفع مقابل إجمالي اللي اتصرف.',
   'Yes. Payments are made in instalments tied to execution stages, not in one go. Each payment is logged with its date in your project statement, and at any time you can see total paid against total spent.',
   7);
