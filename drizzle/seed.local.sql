INSERT INTO prompts (title, prompt, negative_prompt, model, tags, created_at, updated_at)
VALUES
  (
    '赛博朋克肖像',
    'cinematic portrait of a woman in neon-lit cyberpunk city, 85mm lens, dramatic lighting, ultra detailed',
    'blurry, low quality, watermark',
    'Flux',
    '赛博朋克, 肖像, 电影感',
    unixepoch(),
    unixepoch()
  ),
  (
    '日系风景',
    'serene japanese countryside in spring, cherry blossoms, soft morning light, studio ghibli style',
    'dark, gloomy, oversaturated',
    'SD3.5',
    '风景, 日系, 春天',
    unixepoch(),
    unixepoch()
  );