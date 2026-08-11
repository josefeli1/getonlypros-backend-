const BaseAgent = require('./BaseAgent');

/**
 * ScriptWriter Agent
 * The wordsmith. Writes hooks that stop the scroll, bodies that deliver value,
 * and CTAs that convert. Masters TikTok/Instagram voice.
 */
class ScriptWriter extends BaseAgent {
  constructor() {
    super('ScriptWriter', 'script_writer');
    this.hookFormulas = [
      { name: 'PatternInterrupt', template: 'Wait... {surprising_fact} in {location}?', effectiveness: 0.92 },
      { name: 'FearFactor', template: 'Your {thing} is {bad_thing} and you do not even know it...', effectiveness: 0.88 },
      { name: 'SocialProofHook', template: '{number} {location} homeowners already {action} this {timeframe}', effectiveness: 0.85 },
      { name: 'CuriosityGap', template: 'I asked {number} {professionals} the same question. The #1 answer shocked me.', effectiveness: 0.90 },
      { name: 'DirectChallenge', template: 'If you are a {target} in {location}, stop scrolling.', effectiveness: 0.87 },
      { name: 'StoryOpen', template: '{time}. {temperature}. My {thing} just {broke}. Then THIS happened...', effectiveness: 0.91 },
      { name: 'Controversy', template: 'Unpopular opinion: {controversial_statement} in {location}', effectiveness: 0.83 },
      { name: 'TimePressure', template: 'Only {number} {thing} left in {location}. Here is why...', effectiveness: 0.89 },
    ];
    this.voiceGuides = {
      tiktok: 'Gen Z energy. Fast-paced. Emoji-heavy. No corporate speak. Use "you" constantly. Short sentences. Trending audio references.',
      instagram: 'Aspirational but relatable. Polished but authentic. Use storytelling. Emotional hooks. Visual-first descriptions.',
      youtube: 'Educational but entertaining. Clear structure. Value-packed. Authority voice with personality.',
      facebook: 'Community-focused. Local pride. Conversational. Slightly longer form. Trust-building tone.',
    };
  }

  async execute(brief) {
    console.log(`[${this.name}] Writing script for ${brief?.concept} on ${brief?.platform}...`);
    if (!brief) {
      return { success: false, message: 'Brief required for script writing' };
    }

    const hook = this.writeHook(brief);
    const body = this.writeBody(brief);
    const cta = this.writeCTA(brief);
    const voiceover = this.writeVoiceOver(hook, body, cta, brief);
    const captions = this.writeCaptions(hook, body, cta, brief);
    const hashtags = this.generateHashtags(brief);

    return {
      success: true,
      script: {
        concept: brief.concept,
        platform: brief.platform,
        strategy: brief.strategy,
        duration: brief.duration,
        hook,
        body,
        cta,
        voiceover,
        captions,
        hashtags,
        tone: this.voiceGuides[brief.platform] || this.voiceGuides.tiktok,
        keyMessage: brief.keyMessage,
        lasVegasElements: brief.lasVegasElements,
      },
      hookFormula: hook.formula,
    };
  }

  writeHook(brief) {
    const { concept, platform, strategy, hooks } = brief;
    const formula = this.selectHookFormula(strategy, platform);
    const hookText = this.fillHookTemplate(formula, brief);

    return {
      text: hookText,
      formula: formula.name,
      duration: 3, // seconds
      visualDirection: this.getHookVisual(strategy),
      audioDirection: this.getHookAudio(strategy),
      effectiveness: formula.effectiveness,
    };
  }

  selectHookFormula(strategy, platform) {
    // Match strategy to best formula
    const strategyMap = {
      urgency: 'FearFactor',
      aspiration: 'StoryOpen',
      education: 'CuriosityGap',
      scarcity: 'TimePressure',
      social_proof: 'SocialProofHook',
      humor: 'Controversy',
    };
    const formulaName = strategyMap[strategy] || 'PatternInterrupt';
    return this.hookFormulas.find(f => f.name === formulaName) || this.hookFormulas[0];
  }

  fillHookTemplate(formula, brief) {
    const { concept, platform, keyMessage } = brief;
    let text = formula.template;

    // Fill based on concept
    const fills = {
      'emergency-service': {
        surprising_fact: 'your AC is about to fail',
        location: 'Vegas',
        thing: 'AC',
        bad_thing: 'about to die',
        number: '847',
        action: 'used',
        timeframe: 'month',
        professionals: 'HVAC pros',
        target: 'homeowner',
        temperature: '110 degrees',
        broke: 'died',
        controversial_statement: 'you should turn OFF your AC at night',
      },
      'new-homeowner-welcome': {
        surprising_fact: 'new homeowners lose $5,000',
        location: 'Las Vegas',
        thing: 'house',
        bad_thing: 'bleeding money',
        number: '2,400',
        action: 'saved',
        timeframe: 'year',
        professionals: 'contractors',
        target: 'new homeowner',
        temperature: 'Moving day',
        broke: 'cost more than expected',
        controversial_statement: 'your home inspection was worthless',
      },
      'territory-scarcity': {
        surprising_fact: 'your competitor locked 3 zip codes',
        location: 'Summerlin',
        thing: 'territory',
        bad_thing: 'gone',
        number: '1',
        action: 'claimed',
        timeframe: 'week',
        professionals: 'contractors',
        target: 'contractor',
        temperature: 'Today',
        broke: 'got taken',
        controversial_statement: 'leads are not worth what you think',
      },
    };

    const fill = fills[concept] || fills['emergency-service'];
    text = text.replace('{surprising_fact}', fill.surprising_fact);
    text = text.replace('{location}', fill.location);
    text = text.replace('{thing}', fill.thing);
    text = text.replace('{bad_thing}', fill.bad_thing);
    text = text.replace('{number}', fill.number);
    text = text.replace('{action}', fill.action);
    text = text.replace('{timeframe}', fill.timeframe);
    text = text.replace('{professionals}', fill.professionals);
    text = text.replace('{target}', fill.target);
    text = text.replace('{temperature}', fill.temperature);
    text = text.replace('{broke}', fill.broke);
    text = text.replace('{controversial_statement}', fill.controversial_statement);

    return text;
  }

  getHookVisual(strategy) {
    const visuals = {
      urgency: 'Extreme close-up of broken AC unit with sweat dripping. Red/orange color grade. Shaky handheld camera.',
      aspiration: 'Golden hour shot of beautiful Las Vegas home with palm trees. Warm, inviting. Drone rising shot.',
      education: 'Split screen showing problem vs solution. Clean, well-lit. Professional but approachable.',
      scarcity: 'Bold text overlay "ONLY 1 LEFT" with countdown timer. Flashing red border. Tight crop.',
      social_proof: 'Real homeowner face, authentic emotion. Slightly imperfect lighting = more trustworthy.',
      humor: 'Funny facial expression, unexpected prop. Bright colors. Fast zoom in on reaction.',
    };
    return visuals[strategy] || visuals.social_proof;
  }

  getHookAudio(strategy) {
    const audios = {
      urgency: 'Heartbeat sound effect building tension. Sudden silence at 2 seconds. Then alarm beep.',
      aspiration: 'Upbeat, inspiring music. Soft intro building to emotional peak.',
      education: 'Clean, minimal background. Focus on voiceover clarity. Subtle whoosh transitions.',
      scarcity: 'Ticking clock sound effect. Tension-building strings. "Ding" at reveal.',
      social_proof: 'Warm, authentic ambient sound. Natural room tone. Slight emotional music bed.',
      humor: 'Comedic sound effect (boing, record scratch). Upbeat quirky music.',
    };
    return audios[strategy] || audios.social_proof;
  }

  writeBody(brief) {
    const { concept, platform, strategy, keyMessage } = brief;
    const scenes = [];

    // Scene templates based on concept
    const sceneTemplates = {
      'emergency-service': [
        { text: 'It is 2am. 110 degrees outside. Your AC just died.', duration: 3, visual: 'Thermometer hitting 110F. Sweaty homeowner. Dark room.' },
        { text: 'Most people panic and call the first Google result. Big mistake.', duration: 3, visual: 'Phone screen showing random search results. Red X over some.' },
        { text: 'That is how you get a $500 quote that turns into $5,000.', duration: 3, visual: 'Invoice graphic with number climbing. Shocked face.' },
        { text: 'GetOnlyPros vets every contractor. 847 reviews. Zero scams.', duration: 4, visual: '5-star reviews scrolling. Checkmark badges. Trusted pro arriving.' },
      ],
      'new-homeowner-welcome': [
        { text: 'Welcome to Vegas! New house, new neighborhood, new everything.', duration: 3, visual: 'Moving truck. New house exterior. Happy family.' },
        { text: 'But here is what nobody tells you about your first 90 days...', duration: 3, visual: 'Homeowner looking confused. Question marks appearing.' },
        { text: 'You are about to need: AC check, roof inspection, plumber, electrician.', duration: 4, visual: 'Checklist appearing with checkmarks. Fast cuts between services.' },
        { text: 'We have already vetted the best in your zip code. Plus, here is $100 on us.', duration: 4, visual: 'Gift card graphic. Zip code map highlighting. Pro team photo.' },
      ],
      'territory-scarcity': [
        { text: 'We only work with ONE contractor per zip code in Las Vegas.', duration: 3, visual: 'Map of Vegas with zip codes. One glowing per area.' },
        { text: 'Why? Because when a homeowner calls, they want THE expert. Not a random list.', duration: 4, visual: 'Homeowner smiling with one contractor. Red X over long lists.' },
        { text: 'Your competitor in 89135 just locked their 3rd territory this month.', duration: 3, visual: 'Calendar flipping. Territory map with competitor logos.' },
        { text: 'Lock yours before they are all gone. DM us CLAIM + your zip.', duration: 4, visual: 'Phone DM screen. Lock icon. Urgent red countdown.' },
      ],
      'vegas-heat-warning': [
        { text: 'Vegas summer: your AC works 3x harder than any other city.', duration: 3, visual: 'Desert sun. AC unit working hard. Overheat graphic.' },
        { text: 'Here is what happens if you skip the pre-summer checkup...', duration: 3, visual: 'Thermometer climbing. Warning signs. Red alert zones.' },
        { text: 'Compressor failure: $3,500. Refrigerant leak: $800. Total replacement: $8,500.', duration: 4, visual: 'Price tags appearing. Calculator. Shocked homeowner.' },
        { text: 'Free pre-summer check at link in bio. Takes 20 minutes. Saves you thousands.', duration: 4, visual: 'Contractor smiling with clipboard. Checkmark. Savings graphic.' },
      ],
      'contractor-spotlight': [
        { text: 'Meet David. The ONLY AC pro we send to Summerlin 89135.', duration: 3, visual: 'David in uniform. Branded van. Neighborhood shot.' },
        { text: '847 five-star reviews. 12 years in Vegas. Zero complaints.', duration: 3, visual: 'Reviews scrolling. Experience badge. Clean record.' },
        { text: 'Last Tuesday at 2am, he saved a family from 110 degree heat. Here is what they said...', duration: 4, visual: 'Night service footage. Testimonial quote graphic.' },
        { text: 'Book David directly through GetOnlyPros. Link in bio.', duration: 3, visual: 'Booking screen. David waving. GetOnlyPros logo.' },
      ],
      'customer-testimonial': [
        { text: 'Sarah, Summerlin. 2am. AC died during the heat wave.', duration: 3, visual: 'Sarah in her home. Clock showing 2am. Sweating.' },
        { text: 'She called GetOnlyPros. David arrived in 23 minutes.', duration: 3, visual: 'Phone call. Timer graphic. Van arriving.' },
        { text: 'Fixed in under an hour. Total cost: $180. She left this review...', duration: 4, visual: 'Repair footage. Price tag. 5-star review appearing.' },
        { text: 'Real Vegas homeowners. Real emergencies. Real results. Link in bio.', duration: 3, visual: 'Multiple happy homeowners. GetOnlyPros logo. Trust badges.' },
      ],
    };

    const templateScenes = sceneTemplates[concept] || sceneTemplates['emergency-service'];
    templateScenes.forEach((scene, i) => {
      scenes.push({
        sceneNumber: i + 1,
        text: scene.text,
        duration: scene.duration,
        visualDirection: scene.visual,
        audioDirection: i === 0 ? 'Music fades in' : i === templateScenes.length - 1 ? 'Music peaks then fades' : 'Music bed continues',
      });
    });

    return {
      scenes,
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      sceneCount: scenes.length,
    };
  }

  writeCTA(brief) {
    const { concept, platform, strategy } = brief;
    const ctas = {
      'emergency-service': {
        text: 'Save this post. When your AC dies at 2am, you will know exactly who to call. Link in bio.',
        visual: 'Phone screen with GetOnlyPros app. Big "SAVE" button. Flashing arrow.',
        duration: 4,
      },
      'new-homeowner-welcome': {
        text: 'Comment WELCOME and we will DM you your $100 gift card + the vetted contractor list for your zip code.',
        visual: 'Gift card graphic. Comment bubble animation. DM icon. Zip code map.',
        duration: 5,
      },
      'territory-scarcity': {
        text: 'Contractors: DM us CLAIM + your zip code to lock your exclusive territory today.',
        visual: 'Phone DM screen. Lock icon. Map with zip codes. Urgent red glow.',
        duration: 4,
      },
      'vegas-heat-warning': {
        text: 'Book your FREE pre-summer AC check at link in bio. Zero obligation. Zero sales pressure.',
        visual: 'Calendar booking interface. "FREE" badge. Contractor thumbs up.',
        duration: 4,
      },
      'contractor-spotlight': {
        text: 'Book David directly at link in bio. Summerlin 89135. The only pro you will ever need.',
        visual: 'David smiling. Booking button. 5-star rating. Location pin.',
        duration: 4,
      },
      'customer-testimonial': {
        text: 'Read 847 more reviews at link in bio. Meet the only vetted pros in your Las Vegas zip code.',
        visual: 'Reviews scrolling. GetOnlyPros logo. Map of Vegas with pro pins.',
        duration: 4,
      },
    };

    return ctas[concept] || ctas['emergency-service'];
  }

  writeVoiceOver(hook, body, cta, brief) {
    const fullScript = [hook.text, ...body.scenes.map(s => s.text), cta.text].join(' ');
    const wordCount = fullScript.split(' ').length;
    const estimatedDuration = Math.ceil(wordCount / 150 * 60); // 150 words per minute

    return {
      fullScript,
      wordCount,
      estimatedDuration,
      pace: 'conversational', // 150 wpm
      tone: this.voiceGuides[brief.platform] || this.voiceGuides.tiktok,
      notes: 'Speak like you are talking to a friend. Pause after hook. Emphasize numbers and urgency words.',
    };
  }

  writeCaptions(hook, body, cta, brief) {
    const { platform } = brief;
    const allText = [hook.text, ...body.scenes.map(s => s.text), cta.text];

    const captions = allText.map((text, i) => ({
      index: i,
      text,
      style: this.getCaptionStyle(platform),
      displayDuration: i === 0 ? 3 : i === allText.length - 1 ? 4 : 3,
    }));

    return {
      captions,
      totalCaptions: captions.length,
      style: this.getCaptionStyle(platform),
      accessibilityNote: 'Always include captions - 80% of social video is watched muted',
    };
  }

  getCaptionStyle(platform) {
    const styles = {
      tiktok: {
        font: 'Bold sans-serif (Montserrat/Impact)',
        color: 'White with black outline',
        position: 'Center screen',
        animation: 'Pop in with slight bounce',
        size: 'Large - readable on mobile',
      },
      instagram: {
        font: 'Modern sans-serif (Helvetica Neue)',
        color: 'White with subtle shadow',
        position: 'Lower third',
        animation: 'Smooth fade in',
        size: 'Medium - elegant',
      },
      youtube: {
        font: 'Clean sans-serif (Roboto)',
        color: 'White with dark background bar',
        position: 'Bottom center',
        animation: 'Slide up',
        size: 'Medium - professional',
      },
      facebook: {
        font: 'System sans-serif',
        color: 'White with black outline',
        position: 'Center',
        animation: 'Fade in',
        size: 'Large - readable',
      },
    };
    return styles[platform] || styles.tiktok;
  }

  generateHashtags(brief) {
    const { platform, concept } = brief;
    const baseHashtags = ['#GetOnlyPros', '#LasVegas', '#VegasLocal'];
    const conceptTags = {
      'emergency-service': ['#ACRepair', '#VegasHeat', '#EmergencyService', '#Summerlin', '#Henderson'],
      'new-homeowner-welcome': ['#NewHomeowner', '#WelcomeHome', '#VegasRealEstate', '#FirstHome', '#MovingToVegas'],
      'territory-scarcity': ['#ContractorLife', '#VegasContractor', '#Exclusive', '#LockYourZip', '#HVAC'],
      'vegas-heat-warning': ['#VegasSummer', '#ACMaintenance', '#StayCool', '#DesertLife', '#SummerPrep'],
      'contractor-spotlight': ['#ContractorSpotlight', '#VettedPro', '#TopRated', '#LocalExpert', '#TrustedPro'],
      'customer-testimonial': ['#RealReview', '#HappyCustomer', '#VerifiedPro', '#FiveStars', '#VegasHomes'],
    };
    const platformTags = {
      tiktok: ['#FYP', '#ForYou', '#Viral', '#HomeTok'],
      instagram: ['#Reels', '#InstaHome', '#HomeImprovement', '#VegasLife'],
      youtube: ['#Shorts', '#HomeTips', '#YouTubeShorts'],
      facebook: ['#VegasCommunity', '#ShopLocal'],
    };

    const maxTags = { tiktok: 4, instagram: 15, youtube: 8, facebook: 5 }[platform] || 8;
    const allTags = [...baseHashtags, ...(conceptTags[concept] || []), ...(platformTags[platform] || [])];
    return allTags.slice(0, maxTags);
  }
}

module.exports = ScriptWriter;
