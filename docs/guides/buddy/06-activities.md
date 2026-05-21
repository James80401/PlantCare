# Plant Buddy — Activities

## Overview

Activities are guided in-app experiences that help users care for their real plants while earning Sunlight and Dewdrops for their buddy. They differ from tasks in that they are **interactive walkthroughs**, not simple checkboxes. Each activity takes 2–10 minutes and teaches or reinforces real plant care knowledge.

Activities integrate with the existing `journal`, `diagnosis`, and `tasks` modules. They never create duplicate data.

---

## Activity List (10 core activities)

### 1. 💧 Watering Check

**Sunlight Reward:** 12 ☀️
**Dewdrops:** +5 💧
**Time:** 3–5 minutes
**Description:** A guided watering log. The user selects which plants they watered, how much water was given (a little / moderate / thorough soak), and checks the soil drainage. The activity surfaces the watering schedule for each plant and flags any that are overdue.

**Steps:**
1. Select plants to water from their plant list
2. For each plant: how much water? Soil drainage okay?
3. Notes field (optional)
4. Summary card showing next watering date per plant

**Data Written:** Creates a `Task` record (type WATERING) for each plant watered. Optionally appends to `JournalEntry` if user adds notes.

---

### 2. ☀️ Sunlight Audit

**Sunlight Reward:** 10 ☀️
**Dewdrops:** +4 💧
**Time:** 5 minutes
**Description:** Helps the user assess whether each plant is getting appropriate light. Uses the existing `PlantSpecies` light requirement data from the database to compare against what the user reports.

**Steps:**
1. For each plant: how many hours of light per day? Direct or indirect?
2. App compares to species ideal light requirement
3. Traffic light indicator: optimal / borderline / insufficient
4. Recommendations shown for any plants with insufficient light
5. Option to set a "rotate reminder" for plants that need turning

**Data Written:** Creates a `Task` record (type ROTATING) if rotation reminder is set. Writes light notes to plant profile.

---

### 3. 🔍 Pest Inspection

**Sunlight Reward:** 10 ☀️
**Dewdrops:** +5 💧
**Time:** 5–10 minutes
**Description:** A guided checklist for checking each plant for common pests. Integrates with Dr. Plant (existing `DiagnosisConversation`) if the user finds something concerning.

**Steps:**
1. Select plant to inspect
2. Checklist: Check undersides of leaves / Check soil surface / Check stems / Check new growth
3. For each: all clear / something found
4. If something found: describe it → launches Dr. Plant diagnosis
5. If all clear: logs a clean inspection

**Data Written:** Creates a `Task` record (type PEST_CHECK). If diagnosis launched, creates a `DiagnosisConversation`.

---

### 4. 📓 Plant Journal

**Sunlight Reward:** 15 ☀️
**Dewdrops:** +6 💧
**Time:** 5–10 minutes
**Description:** An enriched entry point into the existing journal. Buddy provides a prompt to help the user reflect on their plants today. The journal entry is written to the existing `JournalEntry` model.

**Prompt Examples:**
- "What's the most interesting thing you noticed about your plants this week?"
- "Which plant surprised you recently, and why?"
- "How are your plants making you feel today?"
- "Describe what changed since your last entry."
- "What do you wish you knew when you first got your plants?"

**Steps:**
1. Buddy presents today's prompt
2. User writes a free-text response (or skips with minimum 30 words for full reward)
3. Option to attach a photo
4. Entry saved to existing `JournalEntry`

**Data Written:** Creates a `JournalEntry` record with `source: "buddy_activity"`.

---

### 5. 🪴 Repotting Guide

**Sunlight Reward:** 20 ☀️
**Dewdrops:** +8 💧
**Time:** 10–15 minutes (active repotting time)
**Description:** A step-by-step walkthrough for repotting a plant. The user follows along as they repot in real life.

**Steps:**
1. Select plant to repot
2. Check if roots are rootbound (visual guide shown)
3. Choose new pot size (app recommends 1–2 inches larger)
4. Step-by-step: remove plant / shake loose soil / check roots / trim if needed / add fresh soil / place plant / water lightly / find right spot
5. Log the repot: new pot size, date, any notes
6. App calculates next repot estimate (1–2 years) and sets a reminder

**Data Written:** Creates a `Task` record (type REPOTTING). Updates plant profile with pot size and repot date.

---

### 6. 🌡️ Season Check

**Sunlight Reward:** 10 ☀️
**Dewdrops:** +4 💧
**Time:** 3–5 minutes
**Description:** Adjusts care routines for the current season using the existing `weather` module. Compares current temperature/season with each plant's ideal conditions and flags care adjustments.

**Steps:**
1. App pulls current season and local temperature
2. For each plant: compare to species temperature tolerance
3. Flags: reduce watering frequency / move away from drafts / increase humidity / stop fertilizing for winter
4. User confirms adjustments or skips
5. App updates task frequencies based on confirmed adjustments

**Data Written:** Updates `Task` recurrence settings. Writes season adjustment note to plant profile.

---

### 7. 📸 Progress Photo

**Sunlight Reward:** 8 ☀️
**Dewdrops:** +3 💧
**Time:** 2 minutes
**Description:** Prompts the user to take a photo of a plant, encouraging visual documentation of growth over time.

**Steps:**
1. Select plant to photograph
2. Camera opens (or photo picker)
3. Optional note
4. Photo saved to plant's photo timeline

**Data Written:** Creates a photo entry in the plant's `JournalEntry` with `type: "PHOTO"`.

---

### 8. 🌬️ Humidity Check

**Sunlight Reward:** 7 ☀️
**Dewdrops:** +3 💧
**Time:** 3 minutes
**Description:** Guides the user through assessing humidity for their plants. Uses local weather data to supplement.

**Steps:**
1. What type of plants do you have? (tropical / desert / temperate)
2. Current local humidity shown (from weather module)
3. Signs to check: brown leaf tips / dry soil / condensation on leaves
4. Recommendations: mist / pebble tray / humidifier / reduce misting

**Data Written:** Creates a `Task` record (type HUMIDITY_CHECK).

---

### 9. ✂️ Pruning Guide

**Sunlight Reward:** 12 ☀️
**Dewdrops:** +5 💧
**Time:** 5–10 minutes
**Description:** Walks through when and how to prune specific plant types.

**Steps:**
1. Select plant to prune
2. Why are you pruning? (dead leaves / shape / encourage growth / pest damage)
3. Step-by-step instructions tailored to species
4. Log what was pruned
5. Care note: pruning encourages growth — expect new leaves in 2–4 weeks

**Data Written:** Creates a `Task` record (type PRUNING). Appends prune log to plant profile.

---

### 10. 🌱 Propagation Log

**Sunlight Reward:** 18 ☀️
**Dewdrops:** +8 💧
**Time:** 5 minutes setup + logging
**Description:** Helps the user track a propagation attempt from cutting to rooting to planting.

**Steps:**
1. Select parent plant
2. Method: water propagation / soil propagation / division / leaf cutting / air layering
3. Log cutting date and cutting count
4. Set check-in reminders (weekly root check)
5. When roots appear: log root date
6. When planted: create a new plant in the app from this propagation

**Data Written:** Creates a `Task` record (type PROPAGATION). Creates a propagation tracking entry linked to parent plant. On success, creates a new `Plant` record marked as propagated from parent.

---

## Activity Database Model

```prisma
model BuddyActivity {
  id          String           @id @default(cuid())
  buddyId     String
  buddy       Buddy            @relation(fields: [buddyId], references: [id])
  userId      String

  activityType ActivityType
  completedAt  DateTime        @default(now())
  durationSeconds Int?
  sunlightEarned  Int
  dewdropsEarned  Int

  // Reference to data created
  taskId        String?
  journalEntryId String?
  diagnosisId    String?
  plantId        String?
  notes          String?
}

enum ActivityType {
  WATERING_CHECK
  SUNLIGHT_AUDIT
  PEST_INSPECTION
  PLANT_JOURNAL
  REPOTTING_GUIDE
  SEASON_CHECK
  PROGRESS_PHOTO
  HUMIDITY_CHECK
  PRUNING_GUIDE
  PROPAGATION_LOG
}
```
