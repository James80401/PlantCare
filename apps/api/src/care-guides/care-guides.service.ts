import { Injectable, NotFoundException } from '@nestjs/common';

import { PotSize, TaskType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import {
  buildLocationCareParagraph,
  buildMistCareParagraph,
  classifySpeciesForCare,
  growingEnvironmentLabel,
  inferGrowingEnvironment,
  type GrowingEnvironment,
} from './growing-environment';



export interface GuideImageDto {

  url: string;

  caption: string;

  altText: string;

  mediaType: 'svg' | 'photo';

}



export interface GuideSectionDto {

  heading: string;

  body: string;

  images: GuideImageDto[];

}



export interface TaskInstructionsDto {

  taskId: string;

  taskType: TaskType;

  plantName: string;

  speciesName: string;

  title: string;

  summary: string;

  sections: GuideSectionDto[];

  guideId: string;

  isSpeciesSpecific: boolean;

}



export interface PlantCareOverviewDto {

  growingEnvironment: GrowingEnvironment;

  environmentLabel: string;

  sections: { heading: string; body: string }[];

}



interface GuideSection {

  heading: string;

  body: string;

  imageKeys?: string[];

}



interface PersonalizationContext {

  speciesName: string;

  scientificName: string;

  plantName: string;

  careNotes: string;

  sunlight: string;

  phRange: string;

  wateringFreqDays: number;

  waterIntervalDays: number;

  potSize: string;

  wateringStyle: string;

  drainageNote: string;

  toxicity: string;

  toxicityWarning: string;

  location: string;

  growingEnvironment: GrowingEnvironment;

  environmentLabel: string;

  locationNote: string;

  mistNote: string;

}



@Injectable()

export class CareGuidesService {

  constructor(private prisma: PrismaService) {}



  mediaUrl(imageKey: string): { url: string; mediaType: 'svg' | 'photo' } {

    if (imageKey.startsWith('photo-')) {

      return { url: `/care-guides/photos/${imageKey}.jpg`, mediaType: 'photo' };

    }

    return { url: `/care-guides/images/${imageKey}.svg`, mediaType: 'svg' };

  }



  buildPlantCareOverview(plant: {
    nickname: string | null;
    location: string | null;
    notes: string | null;
    potSize: PotSize;
    species: {
      commonName: string;
      scientificName: string | null;
      careNotes: string | null;
      sunlight: string | null;
      phMin: number | null;
      phMax: number | null;
      wateringFreqDays: number;
      toxicity: string | null;
    };
  }): PlantCareOverviewDto {
    const species = plant.species;
    const plantName = plant.nickname || species.commonName;
    const location = plant.location?.trim() || 'Not set';
    const env = inferGrowingEnvironment(plant.location);
    const category = classifySpeciesForCare(species);
    const ctx = this.buildContext(plantName, species, plant.potSize, plant.location);

    const sections: { heading: string; body: string }[] = [
      {
        heading: 'General care',
        body: [
          `**${species.commonName}** (${ctx.scientificName})`,
          '',
          ctx.careNotes,
          '',
          `☀️ **Light:** ${ctx.sunlight}`,
          '',
          `💧 **Watering:** About every **${ctx.waterIntervalDays}** days in a **${ctx.potSize}** pot (catalog base: ${ctx.wateringFreqDays} days). ${ctx.wateringStyle}`,
          '',
          ctx.drainageNote,
          '',
          `**Soil pH:** ${ctx.phRange}`,
          ctx.toxicityWarning,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
      {
        heading: 'Where you grow it',
        body: buildLocationCareParagraph(env, location, plantName),
      },
      {
        heading: 'Humidity & misting',
        body: buildMistCareParagraph(env, category, plantName),
      },
    ];

    if (plant.notes?.trim()) {
      sections.push({
        heading: 'Your notes',
        body: plant.notes.trim(),
      });
    }

    return {
      growingEnvironment: env,
      environmentLabel: growingEnvironmentLabel(env),
      sections,
    };
  }



  async getInstructionsForTask(userId: string, taskId: string): Promise<TaskInstructionsDto> {

    const task = await this.prisma.task.findFirst({

      where: { id: taskId, plant: { userId } },

      include: { plant: { include: { species: true } } },

    });

    if (!task) throw new NotFoundException('Task not found');



    const { plant } = task;

    const species = plant.species;

    const plantName = plant.nickname || species.commonName;

    const ctx = this.buildContext(plantName, species, plant.potSize, plant.location);



    let guide = await this.prisma.careGuide.findFirst({

      where: { taskType: task.taskType, speciesId: species.id },

      include: { images: { orderBy: { sortOrder: 'asc' } } },

    });



    const isSpeciesSpecific = Boolean(guide);



    if (!guide) {

      guide = await this.prisma.careGuide.findFirst({

        where: { taskType: task.taskType, speciesId: null },

        include: { images: { orderBy: { sortOrder: 'asc' } } },

      });

    }



    if (!guide) {

      return this.fallbackInstructions(taskId, task.taskType, ctx);

    }



    const imageMap = new Map(guide.images.map((img) => [img.imageKey, img]));

    const parsed = JSON.parse(guide.sectionsJson) as GuideSection[];

    const sections = parsed.map((section) => this.mapSection(section, ctx, imageMap));



    sections.push(this.buildYourPlantSection(task.taskType, ctx));



    return {

      taskId,

      taskType: task.taskType,

      plantName,

      speciesName: species.commonName,

      title: this.personalize(guide.title, ctx),

      summary: this.personalize(guide.summary, ctx),

      sections,

      guideId: guide.id,

      isSpeciesSpecific,

    };

  }



  private buildYourPlantSection(taskType: TaskType, ctx: PersonalizationContext): GuideSectionDto {

    const taskHints: Record<TaskType, string> = {

      WATER: `For **${ctx.plantName}**, expect watering about every **${ctx.waterIntervalDays}** days in a **${ctx.potSize}** pot (catalog base: ${ctx.wateringFreqDays} days).`,

      PRUNE: `Prune **${ctx.plantName}** when you see leggy growth, spent flowers, or damaged leaves.`,

      FERTILIZE: `Feed **${ctx.plantName}** during active growth; pause in low light or winter dormancy.`,

      MIST: ctx.mistNote,

      PH_TEST: `Test soil pH for **${ctx.plantName}** — target **${ctx.phRange}**.`,

      PEST_CONTROL: `Inspect **${ctx.plantName}** weekly on new growth and leaf undersides.`,

      REPOT: `Repot **${ctx.plantName}** when roots are crowded; size up 1–2 inches only.`,

    };



    return {

      heading: 'Your plant right now',

      body: [

        taskHints[taskType],

        '',

        `📍 ${ctx.environmentLabel} — ${ctx.location}`,

        '',

        `☀️ ${ctx.sunlight}`,

        '',

        taskType === TaskType.MIST ? ctx.mistNote : '',

        taskType === TaskType.WATER ? ctx.wateringStyle : '',

        taskType === TaskType.WATER ? ctx.drainageNote : '',

        '',

        `**Catalog note:** ${ctx.careNotes}`,

        ctx.toxicityWarning,

      ]

        .filter(Boolean)

        .join('\n\n'),

      images: [],

    };

  }



  private mapSection(

    section: GuideSection,

    ctx: PersonalizationContext,

    imageMap: Map<string, { imageKey: string; caption: string; altText: string }>,

  ): GuideSectionDto {

    const keys = section.imageKeys ?? [];

    const images: GuideImageDto[] = keys

      .map((key) => imageMap.get(key))

      .filter((img): img is NonNullable<typeof img> => Boolean(img))

      .map((img) => {

        const { url, mediaType } = this.mediaUrl(img.imageKey);

        return {

          url,

          caption: img.caption,

          altText: img.altText,

          mediaType,

        };

      });



    return {

      heading: this.personalize(section.heading, ctx),

      body: this.personalize(section.body, ctx),

      images,

    };

  }



  private buildContext(

    plantName: string,

    species: {

      commonName: string;

      scientificName: string | null;

      careNotes: string | null;

      sunlight: string | null;

      phMin: number | null;

      phMax: number | null;

      wateringFreqDays: number;

      toxicity: string | null;

    },

    potSize: PotSize,

    location?: string | null,

  ): PersonalizationContext {

    const waterIntervalDays = this.waterIntervalDays(species.wateringFreqDays, potSize);

    const phRange =

      species.phMin != null && species.phMax != null

        ? `${species.phMin}–${species.phMax}`

        : '6.0–7.0 (typical for most houseplants)';



    const toxicity = species.toxicity?.trim() || 'Check toxicity for your pets and children.';

    const toxicityWarning = /non-toxic/i.test(toxicity)

      ? ''

      : `⚠️ **Safety:** ${toxicity}. Wash hands after handling.`;



    const freq = species.wateringFreqDays;

    let wateringStyle: string;

    let drainageNote: string;



    if (freq >= 12) {

      wateringStyle =

        '**Light watering** suits this plant: add a modest amount evenly through the soil. Do not saturate unless the species guide says otherwise.';

      drainageNote =

        'Use a pot with drainage holes and a fast-draining mix. Empty the saucer after watering so roots never sit in water.';

    } else if (freq <= 5) {

      wateringStyle =

        '**Thorough watering** is best: water slowly until it flows from the drainage holes, then stop. This reaches the full root zone.';

      drainageNote =

        'Good drainage is essential — this plant prefers evenly moist soil, not constant sogginess. Never leave standing water in the saucer.';

    } else {

      wateringStyle =

        '**Moderate watering**: water until the soil is moist throughout the pot, with a little drainage from the bottom, then allow the top inch to dry before the next session.';

      drainageNote =

        'A pot with drainage holes and quality potting mix prevents waterlogged roots.';

    }



    const loc = location?.trim() || 'Not set';

    const growingEnvironment = inferGrowingEnvironment(location);

    const category = classifySpeciesForCare(species);



    return {

      speciesName: species.commonName,

      scientificName: species.scientificName?.trim() || species.commonName,

      plantName,

      careNotes: species.careNotes?.trim() || 'No additional species notes in our catalog yet.',

      sunlight: species.sunlight?.trim() || 'Bright indirect light (adjust if your plant shows stress).',

      phRange,

      wateringFreqDays: species.wateringFreqDays,

      waterIntervalDays,

      potSize: potSize.toLowerCase(),

      wateringStyle,

      drainageNote,

      toxicity,

      toxicityWarning,

      location: loc,

      growingEnvironment,

      environmentLabel: growingEnvironmentLabel(growingEnvironment),

      locationNote: buildLocationCareParagraph(growingEnvironment, loc, plantName),

      mistNote: buildMistCareParagraph(growingEnvironment, category, plantName),

    };

  }



  private waterIntervalDays(wateringFreqDays: number, potSize: PotSize): number {

    const mult = potSize === PotSize.SMALL ? 0.8 : potSize === PotSize.LARGE ? 1.2 : 1.0;

    return Math.max(2, Math.round(wateringFreqDays * mult));

  }



  private personalize(text: string, ctx: PersonalizationContext): string {

    return text

      .replace(/\{speciesName\}/g, ctx.speciesName)

      .replace(/\{scientificName\}/g, ctx.scientificName)

      .replace(/\{plantName\}/g, ctx.plantName)

      .replace(/\{careNotes\}/g, ctx.careNotes)

      .replace(/\{sunlight\}/g, ctx.sunlight)

      .replace(/\{phRange\}/g, ctx.phRange)

      .replace(/\{wateringFreqDays\}/g, String(ctx.wateringFreqDays))

      .replace(/\{waterIntervalDays\}/g, String(ctx.waterIntervalDays))

      .replace(/\{potSize\}/g, ctx.potSize)

      .replace(/\{wateringStyle\}/g, ctx.wateringStyle)

      .replace(/\{drainageNote\}/g, ctx.drainageNote)

      .replace(/\{toxicity\}/g, ctx.toxicity)

      .replace(/\{toxicityWarning\}/g, ctx.toxicityWarning)

      .replace(/\{location\}/g, ctx.location)

      .replace(/\{environmentLabel\}/g, ctx.environmentLabel)

      .replace(/\{locationNote\}/g, ctx.locationNote)

      .replace(/\{mistNote\}/g, ctx.mistNote);

  }



  private fallbackInstructions(

    taskId: string,

    taskType: TaskType,

    ctx: PersonalizationContext,

  ): TaskInstructionsDto {

    const titles: Record<TaskType, string> = {

      WATER: `Watering ${ctx.speciesName}`,

      PRUNE: `Pruning ${ctx.speciesName}`,

      FERTILIZE: `Fertilizing ${ctx.speciesName}`,

      MIST: `Misting ${ctx.speciesName}`,

      PH_TEST: `Soil pH for ${ctx.speciesName}`,

      PEST_CONTROL: `Pest care for ${ctx.speciesName}`,

      REPOT: `Repotting ${ctx.speciesName}`,

    };



    return {

      taskId,

      taskType,

      plantName: ctx.plantName,

      speciesName: ctx.speciesName,

      title: titles[taskType],

      summary: `Personalized tips for your ${ctx.speciesName} based on catalog data.`,

      guideId: 'fallback',

      isSpeciesSpecific: false,

      sections: [

        {

          heading: 'Your plant profile',

          body: `**${ctx.plantName}** (${ctx.speciesName})\n\n☀️ ${ctx.sunlight}\n\n💧 Water about every ${ctx.waterIntervalDays} days in a ${ctx.potSize} pot.\n\n${ctx.wateringStyle}\n\n${ctx.drainageNote}`,

          images: [],

        },

        {

          heading: 'Species notes',

          body: `${ctx.careNotes}\n\n${ctx.toxicityWarning}`,

          images: [],

        },

        this.buildYourPlantSection(taskType, ctx),

      ],

    };

  }

}


