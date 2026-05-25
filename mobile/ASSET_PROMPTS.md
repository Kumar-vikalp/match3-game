# 🎨 Asset Generation Prompts — Gem Crush

Use these prompts with any AI image generator (Midjourney, DALL-E 3, Stable Diffusion, ChatGPT, Gemini).

All assets should match the existing **deep-purple/gold/cyan** brand palette and the **glossy 3D gem** style of the existing gem images.

---

## 📱 App Icon (1024×1024, square, no transparency)

```
A premium mobile game app icon for "GEM CRUSH" match-3 puzzle game. A polished
3D ruby-red gem and a sapphire-blue gem overlapping with sparkle effects, set
against a rich gradient background of deep purple (#1a0b2e) at top fading to
royal purple (#5b21b6) at bottom. Add subtle gold accent highlights radiating
from the center. Glossy reflective surfaces, dramatic studio lighting,
high-end mobile game aesthetic in the style of Royal Match or Candy Crush
Saga. No text. Square 1024x1024. Sharp focus, vibrant saturation, professional
game UI design.
```

**Save as**: `mobile/assets/icon.png` (replace the default Expo icon)

---

## 🌌 Splash Screen / Loading Background (2048×2048 or 1284×2778 for portrait)

```
A premium mobile game splash screen background. Deep purple cosmic gradient
from #0a0118 at top to #2d1b5c at bottom. Scattered glowing gem particles
(red, blue, green, yellow, purple, orange small jewels) floating in a soft
bokeh pattern with subtle motion blur. Magical sparkle dust drifting upward.
Subtle radial vignette darkening the edges. Center is mostly empty for the
logo. Mystical, dreamy, premium mobile gaming aesthetic. Clean composition,
no text, no characters. 1284x2778 portrait orientation.
```

**Save as**: `mobile/assets/splash-icon.png`

---

## ⚡ Power-Up Icons (each 256×256, transparent PNG)

Currently using Lucide vector icons (Shuffle, Bomb, Plus). To upgrade to custom 3D icons that match the gem aesthetic:

### Shuffle power-up
```
A premium 3D mobile game power-up icon: two crossed glowing arrows forming an
infinity-like shuffle symbol, made of polished crystal with cyan and purple
gradient material, surrounded by magical sparkle particles. Glossy reflective
surface, dramatic lighting from above. Transparent background, 256x256 square,
centered, with soft outer glow. Match-3 puzzle game art style, vibrant,
premium, like Royal Match power-up icons.
```

### Destroy / Bomb power-up
```
A premium 3D mobile game power-up icon: a glowing crystal bomb with a magical
fuse on top emitting purple sparks, ruby-red gem material with gold trim,
glossy reflective surface, surrounded by ember particles. Transparent
background, 256x256 square, centered, with soft red outer glow. Match-3
puzzle game art style, vibrant, dangerous-looking, premium.
```

### +5 Moves power-up (hourglass / extra)
```
A premium 3D mobile game power-up icon: a glowing crystal hourglass with
golden sand falling inside, made of clear crystal with gold accents and
magical green energy swirling around it, glossy reflective surface, soft
green outer glow. Transparent background, 256x256 square, centered.
Match-3 puzzle game art style, vibrant, premium.
```

**Save as**:
- `mobile/assets/powerups/shuffle.png`
- `mobile/assets/powerups/bomb.png`
- `mobile/assets/powerups/extra-moves.png`

---

## 🏆 Trophy / Campaign Icon (256×256, transparent)

```
A premium 3D mobile game trophy icon: golden cup with two handles, embedded
amethyst purple gems on the front, set on a deep purple base. Glossy gold
material with reflective highlights, magical golden sparkles around it.
Transparent background, 256x256 square, centered. Match-3 puzzle game art
style, vibrant, victorious, premium.
```

**Save as**: `mobile/assets/icons/trophy.png`

---

## ♾️ Endless / Infinity Icon (256×256, transparent)

```
A premium 3D mobile game icon: a glowing infinity symbol made of polished
cyan crystal with electric blue energy flowing through it, surrounded by
floating sparkle particles. Glossy reflective surface, soft cyan outer
glow. Transparent background, 256x256 square, centered. Match-3 puzzle
game art style, vibrant, dynamic, premium.
```

**Save as**: `mobile/assets/icons/infinity.png`

---

## ⭐ Gold Star (256×256, transparent)

```
A premium 3D mobile game star icon: a polished 5-pointed star made of bright
gold metal with subtle facets like a cut gem, glossy reflective surface,
warm golden glow radiating outward, magical sparkle particles. Transparent
background, 256x256 square, centered, perfectly symmetrical. Match-3 puzzle
game art style, celebratory, premium.
```

**Save as**: `mobile/assets/icons/star.png`

---

## 🎉 Win / Level Complete Banner (1024×512, transparent)

```
A premium 3D mobile game banner ribbon for "Level Complete!". Curved golden
banner with red ribbon ends, glossy metallic material, ornate gold trim, tiny
embedded gems on the corners. Transparent background, horizontal 1024x512.
No text on the banner. Match-3 puzzle game celebration style, victorious,
festive, premium.
```

**Save as**: `mobile/assets/icons/win-banner.png`

---

## 🔒 Locked Level Padlock (256×256, transparent)

```
A premium 3D mobile game padlock icon: ornate purple metal padlock with a
keyhole, slight glow from inside the keyhole hinting at gems within, glossy
purple reflective surface with gold trim. Transparent background, 256x256
square, centered. Match-3 puzzle game art style, mysterious, premium.
```

**Save as**: `mobile/assets/icons/lock.png`

---

## 💯 "How to Play" Tutorial Cards

If you want illustrated tutorial cards (1024×640 each):

### Card 1 — Match 3
```
A premium 3D mobile game tutorial illustration: three matching red gems
aligned horizontally on a dark purple game board with a finger swiping motion
indicated by a glowing trail and arrow. Soft magical glow on the matching
gems. Gradient purple background. No text. Match-3 puzzle game style,
clean, instructional, premium. 1024x640.
```

### Card 2 — Special Pieces
```
A premium 3D mobile game tutorial illustration: a glowing crystal bomb gem in
the center surrounded by a 3x3 explosion radius shown with electric purple
energy waves clearing the surrounding gems. Dark purple game board
background. No text. Match-3 puzzle game style, dramatic, premium. 1024x640.
```

### Card 3 — Combos
```
A premium 3D mobile game tutorial illustration: a chain reaction of multiple
gem matches happening simultaneously with a "3x COMBO" effect implied by
glowing yellow energy trails connecting them. Dark purple game board
background, magical sparkles flying outward. No text. Match-3 puzzle game
style, exciting, premium. 1024x640.
```

**Save as**: `mobile/assets/tutorial/match.png`, `bomb.png`, `combo.png`

---

## 🎵 Sound effects to add later (free sources)

You don't have these yet, but for an even more polished feel:
- Match clear chime (light glassy sound)
- Combo intensifying tones (1x → 2x → 3x ascending pitch)
- Gem swap "whoosh"
- Level complete fanfare
- Bomb explosion
- Star earned ding

Free sources:
- https://freesound.org
- https://pixabay.com/sound-effects/
- Search: "match 3", "puzzle", "gem", "magical chime"

---

## How to use these assets in the app

After generating an image, save it to the path indicated, then commit:
```bash
git add mobile/assets/<file>
git commit -m "assets: add <name>"
git push
```

For app icon and splash, you'll need to rebuild the APK (`eas build`) since
they're baked into the native bundle.

For in-app icons (powerups, trophy, etc.), they'll show up on next reload.
