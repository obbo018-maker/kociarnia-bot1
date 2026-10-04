const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const config = require("./config.json");

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel
    ]
});

// ======================================================
// KOLORY
// ======================================================

const COLORS = {
    MAIN: "#9B5DE5",
    PINK: "#F15BB5",
    LIGHT: "#FF9DE2",
    PURPLE: "#5A189A",
    SUCCESS: "#57F287",
    ERROR: "#ED4245",
    WARNING: "#FEE75C",
    INFO: "#7289DA",
    DARK: "#24152F"
};

// ======================================================
// EMOJI
// ======================================================

function emoji(guild, name) {
    if (!guild) return "";

    const found = guild.emojis.cache.find(
        e => e.name === name
    );

    return found ? found.toString() : "";
}

// ======================================================
// EMBED
// ======================================================

function createEmbed(
    guild,
    title,
    description,
    color = COLORS.MAIN
) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text: "© 2026 Kociarnia × Community"
        })
        .setTimestamp();
}

// ======================================================
// CONFIG
// ======================================================

function saveConfig() {
    try {
        fs.writeFileSync(
            "./config.json",
            JSON.stringify(config, null, 2),
            "utf8"
        );

        console.log("💾 config.json zapisany.");
    } catch (error) {
        console.error(
            "❌ Nie udało się zapisać config.json:",
            error.message
        );
    }
}

// ======================================================
// LOG
// ======================================================

async function sendLog(guild, embed) {
    if (!config.LOG_CHANNEL_ID) return;

    const channel = guild.channels.cache.get(
        config.LOG_CHANNEL_ID
    );

    if (!channel) return;

    try {
        await channel.send({
            embeds: [embed]
        });
    } catch {}
}

// ======================================================
// KOMENDY
// ======================================================

const commands = [

    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Pokazuje pomoc"),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Sprawdza ping bota"),

    new SlashCommandBuilder()
        .setName("server")
        .setDescription("Tworzy cały serwer Kociarnia"),

    new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Pokazuje informacje o użytkowniku")
        .addUserOption(option =>
            option
                .setName("uzytkownik")
                .setDescription("Wybierz użytkownika")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Usuwa wiadomości")
        .addIntegerOption(option =>
            option
                .setName("ilosc")
                .setDescription("Liczba wiadomości")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Nadaje timeout")
        .addUserOption(option =>
            option
                .setName("uzytkownik")
                .setDescription("Użytkownik")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("minuty")
                .setDescription("Liczba minut")
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("powod")
                .setDescription("Powód")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("event")
        .setDescription("Publikuje wydarzenie")
        .addStringOption(option =>
            option
                .setName("nazwa")
                .setDescription("Nazwa wydarzenia")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("opis")
                .setDescription("Opis wydarzenia")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("data")
                .setDescription("Data wydarzenia")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("godzina")
                .setDescription("Godzina")
                .setRequired(true)
        )

].map(command => command.toJSON());

// ======================================================
// READY
// ======================================================

client.once("clientReady", async () => {

    console.log(
        `🐱 Zalogowano jako ${client.user.tag}`
    );

    client.user.setPresence({
        activities: [
            {
                name: "Kociarnia",
                type: 3
            }
        ],
        status: "online"
    });

    try {

        const rest = new REST({
            version: "10"
        }).setToken(config.TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(
                config.CLIENT_ID,
                config.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            "✅ Komendy zarejestrowane."
        );

    } catch (error) {

        console.error(
            "❌ Rejestracja komend:",
            error.message
        );
    }
});

// ======================================================
// KREATOR SERWERA
// ======================================================

async function createKociarniaServer(guild) {

    const botMember = guild.members.me;

    if (!botMember) {
        throw new Error(
            "Nie znaleziono bota."
        );
    }

    if (
        !botMember.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {
        throw new Error(
            "Bot musi mieć Administratora."
        );
    }

    // ==================================================
    // USUWANIE KANAŁÓW
    // ==================================================

    console.log("🗑️ Usuwanie kanałów...");

    const oldChannels = [
        ...guild.channels.cache.values()
    ];

    for (const channel of oldChannels) {

        try {

            await channel.delete(
                "Kociarnia - reset serwera"
            );

            console.log(
                `🗑️ ${channel.name}`
            );

        } catch (error) {

            console.log(
                `⚠️ Nie można usunąć ${channel.name}`
            );
        }
    }

    // ==================================================
    // USUWANIE RÓL
    // ==================================================

    console.log("🗑️ Usuwanie starych ról...");

    const oldRoles = [
        ...guild.roles.cache.values()
    ];

    for (const role of oldRoles) {

        // @everyone
        if (role.id === guild.id) {
            continue;
        }

        // Role zarządzane przez Discord/integracje
        if (role.managed) {
            continue;
        }

        // Ról wyżej od bota nie można usunąć
        if (
            role.position >=
            botMember.roles.highest.position
        ) {

            console.log(
                `⚠️ Pominięto rolę: ${role.name}`
            );

            continue;
        }

        try {

            await role.delete(
                "Kociarnia - reset wszystkich ról"
            );

            console.log(
                `🗑️ Usunięto rolę: ${role.name}`
            );

        } catch (error) {

            console.log(
                `⚠️ Błąd przy roli ${role.name}`
            );
        }
    }

    // ==================================================
    // NOWE ROLE
    // ==================================================

    console.log("🎭 Tworzenie nowych rang...");

    const roles = {};

    // --------------------------------------------------
    // ZARZĄD
    // --------------------------------------------------

    roles.owner =
        await guild.roles.create({
            name: "👑 Właściciel",
            color: "#FF0000",
            permissions: [
                PermissionsBitField.Flags.Administrator
            ],
            reason: "Kociarnia - role"
        });

    roles.coOwner =
        await guild.roles.create({
            name: "💎 Współwłaściciel",
            color: "#FFD700",
            permissions: [
                PermissionsBitField.Flags.Administrator
            ],
            reason: "Kociarnia - role"
        });

    roles.deputy =
        await guild.roles.create({
            name: "🔱 Zastępca Właściciela",
            color: "#E5B8FF",
            permissions: [
                PermissionsBitField.Flags.Administrator
            ],
            reason: "Kociarnia - role"
        });

    roles.ceo =
        await guild.roles.create({
            name: "🏆 CEO",
            color: "#FFB703",
            permissions: [
                PermissionsBitField.Flags.Administrator
            ],
            reason: "Kociarnia - role"
        });

    roles.headAdmin =
        await guild.roles.create({
            name: "🧠 Head Admin",
            color: "#9B5DE5",
            permissions: [
                PermissionsBitField.Flags.Administrator
            ],
            reason: "Kociarnia - role"
        });

    // --------------------------------------------------
    // ADMINISTRACJA
    // --------------------------------------------------

    roles.admin =
        await guild.roles.create({
            name: "🛡️ Administrator",
            color: "#7B2CBF",
            permissions: [
                PermissionsBitField.Flags.ManageGuild,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.KickMembers,
                PermissionsBitField.Flags.BanMembers,
                PermissionsBitField.Flags.ModerateMembers
            ],
            reason: "Kociarnia - role"
        });

    roles.juniorAdmin =
        await guild.roles.create({
            name: "⚔️ Junior Administrator",
            color: "#8338EC",
            permissions: [
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.KickMembers,
                PermissionsBitField.Flags.ModerateMembers
            ],
            reason: "Kociarnia - role"
        });

    roles.headModerator =
        await guild.roles.create({
            name: "🔨 Head Moderator",
            color: "#5A189A",
            permissions: [
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.KickMembers,
                PermissionsBitField.Flags.ModerateMembers
            ],
            reason: "Kociarnia - role"
        });

    roles.moderator =
        await guild.roles.create({
            name: "🔧 Moderator",
            color: "#6C4AB6",
            permissions: [
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.ModerateMembers
            ],
            reason: "Kociarnia - role"
        });

    roles.juniorModerator =
        await guild.roles.create({
            name: "🧹 Junior Moderator",
            color: "#8E72C7",
            permissions: [
                PermissionsBitField.Flags.ManageMessages
            ],
            reason: "Kociarnia - role"
        });

    roles.trialModerator =
        await guild.roles.create({
            name: "🔍 Trial Moderator",
            color: "#A98DD6",
            permissions: [
                PermissionsBitField.Flags.ManageMessages
            ],
            reason: "Kociarnia - role"
        });

    roles.helper =
        await guild.roles.create({
            name: "💬 Helper",
            color: "#57F287",
            reason: "Kociarnia - role"
        });

    roles.trialHelper =
        await guild.roles.create({
            name: "🌱 Trial Helper",
            color: "#8BE28B",
            reason: "Kociarnia - role"
        });

    // --------------------------------------------------
    // SPECJALNE
    // --------------------------------------------------

    roles.developer =
        await guild.roles.create({
            name: "💻 Developer",
            color: "#5865F2",
            reason: "Kociarnia - role"
        });

    roles.bot =
        await guild.roles.create({
            name: "🤖 Bot",
            color: "#7289DA",
            reason: "Kociarnia - role"
        });

    roles.sponsor =
        await guild.roles.create({
            name: "💰 Sponsor",
            color: "#FEE75C",
            reason: "Kociarnia - role"
        });

    roles.partner =
        await guild.roles.create({
            name: "🤝 Partner",
            color: "#F15BB5",
            reason: "Kociarnia - role"
        });

    roles.designer =
        await guild.roles.create({
            name: "🎨 Designer",
            color: "#FF9DE2",
            reason: "Kociarnia - role"
        });

    roles.media =
        await guild.roles.create({
            name: "📸 Media Team",
            color: "#FF70A6",
            reason: "Kociarnia - role"
        });

    roles.creator =
        await guild.roles.create({
            name: "🎥 Content Creator",
            color: "#FB5607",
            reason: "Kociarnia - role"
        });

    roles.events =
        await guild.roles.create({
            name: "🎉 Event Team",
            color: "#FF006E",
            reason: "Kociarnia - role"
        });

    // --------------------------------------------------
    // SPOŁECZNOŚĆ
    // --------------------------------------------------

    roles.vip =
        await guild.roles.create({
            name: "🌟 VIP",
            color: "#FFD166",
            reason: "Kociarnia - role"
        });

    roles.premium =
        await guild.roles.create({
            name: "💫 Premium",
            color: "#C77DFF",
            reason: "Kociarnia - role"
        });

    roles.veteran =
        await guild.roles.create({
            name: "🏅 Veteran",
            color: "#90BE6D",
            reason: "Kociarnia - role"
        });

    roles.member =
        await guild.roles.create({
            name: "🐾 Kociak",
            color: "#FF9DE2",
            reason: "Kociarnia - role"
        });

    roles.newMember =
        await guild.roles.create({
            name: "🐱 Nowy Kociak",
            color: "#DDB6F2",
            reason: "Kociarnia - role"
        });

    // ==================================================
    // KATEGORIE
    // ==================================================

    console.log("📁 Tworzenie kategorii...");

    const categories = {};

    categories.info =
        await guild.channels.create({
            name: "🏠・KOCiARNIA",
            type: ChannelType.GuildCategory
        });

    categories.community =
        await guild.channels.create({
            name: "💬・SPOŁECZNOŚĆ",
            type: ChannelType.GuildCategory
        });

    categories.fun =
        await guild.channels.create({
            name: "🎮・ROZRYWKA",
            type: ChannelType.GuildCategory
        });

    categories.help =
        await guild.channels.create({
            name: "🆘・POMOC",
            type: ChannelType.GuildCategory
        });

    categories.voice =
        await guild.channels.create({
            name: "🔊・GŁOSOWE",
            type: ChannelType.GuildCategory
        });

    categories.staff =
        await guild.channels.create({
            name: "🔒・ADMINISTRACJA",
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: roles.owner.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: roles.coOwner.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: roles.admin.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: roles.headAdmin.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: roles.moderator.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                }
            ]
        });

    // ==================================================
    // KANAŁY TEKSTOWE
    // ==================================================

    async function textChannel(
        name,
        parent,
        topic
    ) {

        return await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: parent.id,
            topic: topic || undefined
        });
    }

    const welcome =
        await textChannel(
            "👋・witaj",
            categories.info,
            "Witamy w Kociarni!"
        );

    const rules =
        await textChannel(
            "📜・regulamin",
            categories.info,
            "Regulamin Kociarni"
        );

    const announcements =
        await textChannel(
            "📢・ogloszenia",
            categories.info,
            "Najważniejsze informacje"
        );

    const rolesChannel =
        await textChannel(
            "🎭・role",
            categories.info,
            "Role serwera"
        );

    const chat =
        await textChannel(
            "💬・chat",
            categories.community
        );

    const media =
        await textChannel(
            "📸・media",
            categories.community
        );

    const partnerships =
        await textChannel(
            "🤝・partnerstwa",
            categories.community
        );

    const creations =
        await textChannel(
            "🎨・tworczosc",
            categories.community
        );

    const gaming =
        await textChannel(
            "🎮・gaming",
            categories.fun
        );

    const memes =
        await textChannel(
            "😂・memy",
            categories.fun
        );

    const help =
        await textChannel(
            "🆘・pomoc",
            categories.help
        );

    const logs =
        await textChannel(
            "📋・logi",
            categories.staff
        );

    const moderation =
        await textChannel(
            "🛡️・moderacja",
            categories.staff
        );

    // ==================================================
    // KANAŁY GŁOSOWE
    // ==================================================

    await guild.channels.create({
        name: "🔊・rozmowy",
        type: ChannelType.GuildVoice,
        parent: categories.voice.id
    });

    await guild.channels.create({
        name: "🎮・gaming",
        type: ChannelType.GuildVoice,
        parent: categories.voice.id
    });

    await guild.channels.create({
        name: "🐱・kociarnia",
        type: ChannelType.GuildVoice,
        parent: categories.voice.id
    });

    // ==================================================
    // CONFIG
    // ==================================================

    config.AUTOROLE_ID =
        roles.newMember.id;

    config.WELCOME_CHANNEL_ID =
        welcome.id;

    config.GOODBYE_CHANNEL_ID =
        welcome.id;

    config.PARTNERSHIP_CHANNEL_ID =
        partnerships.id;

    config.PARTNER_ROLE_ID =
        roles.partner.id;

    config.LOG_CHANNEL_ID =
        logs.id;

    config.MODERATION_LOG_CHANNEL_ID =
        moderation.id;

    config.MESSAGE_LOG_CHANNEL_ID =
        logs.id;

    saveConfig();

    // ==================================================
    // WELCOME
    // ==================================================

    await welcome.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲WITAJ W KOCiARNI`,
                [
                    `${emoji(guild, "gwiazdki")} **Witaj na serwerze!**`,
                    "",
                    "🐱 Miło Cię widzieć w naszej społeczności.",
                    "",
                    `📜 Regulamin: ${rules}`,
                    `🎭 Role: ${rolesChannel}`,
                    `💬 Chat: ${chat}`,
                    "",
                    `${emoji(guild, "Serce")} Miłej zabawy!`
                ].join("\n"),
                COLORS.PINK
            )
        ]
    });

    // ==================================================
    // REGULAMIN
    // ==================================================

    await rules.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "Regulamin")}︲REGULAMIN`,
                [
                    `${emoji(guild, "gwiazdki")} **1. Szanuj innych**`,
                    "Nie obrażaj innych użytkowników.",
                    "",
                    `${emoji(guild, "gwiazdki")} **2. Bez spamu**`,
                    "Nie spamuj wiadomościami ani oznaczeniami.",
                    "",
                    `${emoji(guild, "gwiazdki")} **3. Odpowiednie treści**`,
                    "Publikuj treści odpowiednie dla społeczności.",
                    "",
                    `${emoji(guild, "gwiazdki")} **4. Reklamy i partnerstwa**`,
                    "Korzystaj z kanału partnerstw.",
                    "",
                    `${emoji(guild, "gwiazdki")} **5. Administracja**`,
                    "Szanuj decyzje administracji.",
                    "",
                    `${emoji(guild, "Serce")} Dbajmy wspólnie o Kociarnię!`
                ].join("\n"),
                COLORS.PURPLE
            )
        ]
    });

    // ==================================================
    // OGŁOSZENIA
    // ==================================================

    await announcements.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲OGŁOSZENIA`,
                [
                    `${emoji(guild, "gwiazdki")} **Najważniejsze informacje**`,
                    "",
                    `${emoji(guild, "kalendarz")} Wydarzenia`,
                    `${emoji(guild, "ArrowPurple")} Aktualizacje`,
                    `${emoji(guild, "ArrowPurple")} Ważne informacje`,
                    "",
                    `${emoji(guild, "Serce")} Sprawdzaj kanał regularnie.`
                ].join("\n"),
                COLORS.MAIN
            )
        ]
    });

    // ==================================================
    // ROLE
    // ==================================================

    await rolesChannel.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲HIERARCHIA KOCiARNI`,
                [
                    `${emoji(guild, "gwiazdki")} **ZARZĄD**`,
                    `${roles.owner}`,
                    `${roles.coOwner}`,
                    `${roles.deputy}`,
                    `${roles.ceo}`,
                    `${roles.headAdmin}`,
                    "",
                    `${emoji(guild, "gwiazdki")} **ADMINISTRACJA**`,
                    `${roles.admin}`,
                    `${roles.juniorAdmin}`,
                    `${roles.headModerator}`,
                    `${roles.moderator}`,
                    `${roles.juniorModerator}`,
                    `${roles.trialModerator}`,
                    `${roles.helper}`,
                    `${roles.trialHelper}`,
                    "",
                    `${emoji(guild, "gwiazdki")} **SPECJALNE**`,
                    `${roles.developer}`,
                    `${roles.bot}`,
                    `${roles.sponsor}`,
                    `${roles.partner}`,
                    `${roles.designer}`,
                    `${roles.media}`,
                    `${roles.creator}`,
                    `${roles.events}`,
                    "",
                    `${emoji(guild, "gwiazdki")} **SPOŁECZNOŚĆ**`,
                    `${roles.vip}`,
                    `${roles.premium}`,
                    `${roles.veteran}`,
                    `${roles.member}`,
                    `${roles.newMember}`
                ].join("\n"),
                COLORS.PINK
            )
        ]
    });

    // ==================================================
    // POMOC
    // ==================================================

    await help.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲POMOC`,
                [
                    `${emoji(guild, "gwiazdki")} **Potrzebujesz pomocy?**`,
                    "",
                    "Opisz dokładnie swój problem.",
                    "",
                    `${emoji(guild, "ArrowPurple")} Nie spamuj administracji.`,
                    `${emoji(guild, "ArrowPurple")} Zachowaj kulturę.`,
                    `${emoji(guild, "ArrowPurple")} Poczekaj na odpowiedź.`,
                    "",
                    `${emoji(guild, "Serce")} Chętnie pomożemy!`
                ].join("\n"),
                COLORS.INFO
            )
        ]
    });

    // ==================================================
    // LOGI
    // ==================================================

    await logs.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲LOGI`,
                [
                    `${emoji(guild, "gwiazdki")} **System logów Kociarni**`,
                    "",
                    "Tutaj bot zapisuje najważniejsze działania.",
                    "",
                    `${emoji(guild, "Serce")} Kanał administracyjny.`
                ].join("\n"),
                COLORS.DARK
            )
        ]
    });

    await moderation.send({
        embeds: [
            createEmbed(
                guild,
                `${emoji(guild, "logo")}︲MODERACJA`,
                [
                    `${emoji(guild, "gwiazdki")} **Logi moderacji**`,
                    "",
                    "Tutaj trafiają działania moderacyjne.",
                    "",
                    `${emoji(guild, "Serce")} Kanał dla administracji.`
                ].join("\n"),
                COLORS.DARK
            )
        ]
    });

    return {
        roles: Object.keys(roles).length,
        categories: Object.keys(categories).length,
        textChannels: 13,
        voiceChannels: 3
    };
}

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isChatInputCommand()) {
            return;
        }

        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({
                content:
                    "Ta komenda działa tylko na serwerze.",
                ephemeral: true
            });
        }

        // ==================================================
        // HELP
        // ==================================================

        if (
            interaction.commandName === "help"
        ) {

            return interaction.reply({
                embeds: [
                    createEmbed(
                        guild,
                        `${emoji(guild, "logo")}︲KOCiARNIA • HELP`,
                        [
                            `${emoji(guild, "gwiazdki")} **Komendy**`,
                            "",
                            "`/help` — pomoc",
                            "`/ping` — ping",
                            "`/server` — stworzenie serwera",
                            "`/userinfo` — użytkownik",
                            "`/clear` — czyszczenie",
                            "`/timeout` — timeout",
                            "`/event` — wydarzenie",
                            "",
                            `${emoji(guild, "Serce")} **Automatyczne systemy**`,
                            "🤝 Partnerstwa",
                            "🐱 Autorole",
                            "👋 Powitania",
                            "🚪 Pożegnania",
                            "📋 Logi"
                        ].join("\n"),
                        COLORS.MAIN
                    )
                ]
            });
        }

        // ==================================================
        // PING
        // ==================================================

        if (
            interaction.commandName === "ping"
        ) {

            return interaction.reply({
                embeds: [
                    createEmbed(
                        guild,
                        `${emoji(guild, "logo")}︲PING`,
                        [
                            `${emoji(guild, "gwiazdki")} Bot działa poprawnie!`,
                            "",
                            `🏓 Ping: \`${client.ws.ping}ms\``,
                            "🟢 Status: Online",
                            "",
                            `${emoji(guild, "Serce")} Kociarnia`
                        ].join("\n"),
                        COLORS.SUCCESS
                    )
                ]
            });
        }

        // ==================================================
        // SERVER
        // ==================================================

        if (
            interaction.commandName === "server"
        ) {

            if (
                !interaction.member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        createEmbed(
                            guild,
                            `${emoji(guild, "nie")}︲BRAK UPRAWNIEŃ`,
                            "Tylko administrator może użyć tej komendy.",
                            COLORS.ERROR
                        )
                    ]
                });
            }

            await interaction.reply({
                embeds: [
                    createEmbed(
                        guild,
                        `${emoji(guild, "logo")}︲KREATOR KOCiARNI`,
                        [
                            `${emoji(guild, "gwiazdki")} **Rozpoczynam tworzenie serwera...**`,
                            "",
                            "🗑️ Usuwanie kanałów",
                            "🗑️ Usuwanie starych rang",
                            "👑 Tworzenie hierarchii",
                            "📁 Kategorie",
                            "💬 Kanały tekstowe",
                            "🔊 Kanały głosowe",
                            "📜 Regulamin",
                            "👋 Powitanie",
                            "📋 Logi",
                            "",
                            `${emoji(guild, "Serce")} Poczekaj...`
                        ].join("\n"),
                        COLORS.MAIN
                    )
                ]
            });

            try {

                const result =
                    await createKociarniaServer(
                        guild
                    );

                await interaction.editReply({
                    embeds: [
                        createEmbed(
                            guild,
                            `${emoji(guild, "tak")}︲KOCiARNIA GOTOWA`,
                            [
                                `${emoji(guild, "gwiazdki")} **Serwer został przebudowany!**`,
                                "",
                                `🎭 Rangi: \`${result.roles}\``,
                                `📁 Kategorie: \`${result.categories}\``,
                                `💬 Kanały tekstowe: \`${result.textChannels}\``,
                                `🔊 Kanały głosowe: \`${result.voiceChannels}\``,
                                "",
                                `${emoji(guild, "tak")} Regulamin`,
                                `${emoji(guild, "tak")} Powitanie`,
                                `${emoji(guild, "tak")} Logi`,
                                `${emoji(guild, "tak")} Partnerstwa`,
                                `${emoji(guild, "tak")} Autorole`,
                                "",
                                `${emoji(guild, "Serce")} **Kociarnia gotowa!**`
                            ].join("\n"),
                            COLORS.SUCCESS
                        )
                    ]
                });

            } catch (error) {

                console.error(
                    "❌ KREATOR:",
                    error
                );

                await interaction.editReply({
                    embeds: [
                        createEmbed(
                            guild,
                            `${emoji(guild, "nie")}︲BŁĄD`,
                            [
                                "Nie udało się utworzyć serwera.",
                                "",
                                `\`${error.message}\``,
                                "",
                                "Sprawdź uprawnienia bota."
                            ].join("\n"),
                            COLORS.ERROR
                        )
                    ]
                });
            }

            return;
        }

        // ==================================================
        // USERINFO
        // ==================================================

        if (
            interaction.commandName === "userinfo"
        ) {

            const user =
                interaction.options.getUser(
                    "uzytkownik"
                ) || interaction.user;

            const member =
                await guild.members.fetch(
                    user.id
                ).catch(() => null);

            const roleList =
                member
                    ? member.roles.cache
                        .filter(
                            role =>
                                role.id !== guild.id
                        )
                        .map(
                            role =>
                                role.toString()
                        )
                        .slice(0, 15)
                        .join(" ")
                    : "Brak";

            const embed =
                createEmbed(
                    guild,
                    `${emoji(guild, "logo")}︲USERINFO`,
                    [
                        `${emoji(guild, "Osoby")} **Użytkownik:** ${user}`,
                        "",
                        `${emoji(guild, "ArrowPurple")} **Nazwa:** \`${user.tag}\``,
                        `${emoji(guild, "ArrowPurple")} **ID:** \`${user.id}\``,
                        "",
                        `${emoji(guild, "kalendarz")} **Konto utworzone:**`,
                        `<t:${Math.floor(
                            user.createdTimestamp / 1000
                        )}:F>`,
                        "",
                        `${emoji(guild, "Serce")} **Role:**`,
                        roleList || "Brak"
                    ].join("\n"),
                    COLORS.PINK
                );

            embed.setThumbnail(
                user.displayAvatarURL({
                    size: 1024
                })
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // ==================================================
        // CLEAR
        // ==================================================

        if (
            interaction.commandName === "clear"
        ) {

            if (
                !interaction.member.permissions.has(
                    PermissionsBitField.Flags.ManageMessages
                )
            ) {

                return interaction.reply({
                    ephemeral: true,
                    content:
                        "Nie masz uprawnień."
                });
            }

            const amount =
                interaction.options.getInteger(
                    "ilosc"
                );

            try {

                const deleted =
                    await interaction.channel.bulkDelete(
                        amount,
                        true
                    );

                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        createEmbed(
                            guild,
                            `${emoji(guild, "tak")}︲WYCZYSZCZONO`,
                            `Usunięto \`${deleted.size}\` wiadomości.`,
                            COLORS.SUCCESS
                        )
                    ]
                });

            } catch {

                return interaction.reply({
                    ephemeral: true,
                    content:
                        "Nie udało się usunąć wiadomości."
                });
            }
        }

        // ==================================================
        // TIMEOUT
        // ==================================================

        if (
            interaction.commandName === "timeout"
        ) {

            if (
                !interaction.member.permissions.has(
                    PermissionsBitField.Flags.ModerateMembers
                )
            ) {

                return interaction.reply({
                    ephemeral: true,
                    content:
                        "Nie masz uprawnień."
                });
            }

            const user =
                interaction.options.getUser(
                    "uzytkownik"
                );

            const minutes =
                interaction.options.getInteger(
                    "minuty"
                );

            const reason =
                interaction.options.getString(
                    "powod"
                ) || "Brak powodu";

            const member =
                await guild.members.fetch(
                    user.id
                ).catch(() => null);

            if (!member) {

                return interaction.reply({
                    ephemeral: true,
                    content:
                        "Nie znaleziono użytkownika."
                });
            }

            try {

                await member.timeout(
                    minutes * 60 * 1000,
                    reason
                );

                return interaction.reply({
                    embeds: [
                        createEmbed(
                            guild,
                            `${emoji(guild, "tak")}︲TIMEOUT`,
                            [
                                `${emoji(guild, "Osoby")} **Użytkownik:** ${user}`,
                                `${emoji(guild, "kalendarz")} **Czas:** ${minutes} min`,
                                `${emoji(guild, "ArrowPurple")} **Powód:** ${reason}`,
                                "",
                                `${emoji(guild, "Serce")} Moderator: ${interaction.user}`
                            ].join("\n"),
                            COLORS.SUCCESS
                        )
                    ]
                });

            } catch {

                return interaction.reply({
                    ephemeral: true,
                    content:
                        "Nie udało się nadać timeoutu."
                });
            }
        }

        // ==================================================
        // EVENT
        // ==================================================

        if (
            interaction.commandName === "event"
        ) {

            const name =
                interaction.options.getString(
                    "nazwa"
                );

            const description =
                interaction.options.getString(
                    "opis"
                );

            const date =
                interaction.options.getString(
                    "data"
                );

            const time =
                interaction.options.getString(
                    "godzina"
                );

            return interaction.reply({
                embeds: [
                    createEmbed(
                        guild,
                        `${emoji(guild, "kalendarz")}︲${name}`,
                        [
                            `${emoji(guild, "gwiazdki")} **Opis**`,
                            description,
                            "",
                            `${emoji(guild, "kalendarz")} **Data:** ${date}`,
                            `${emoji(guild, "ArrowPurple")} **Godzina:** ${time}`,
                            "",
                            `${emoji(guild, "Serce")} Organizator: ${interaction.user}`
                        ].join("\n"),
                        COLORS.PINK
                    )
                ]
            });
        }
    }
);

// ======================================================
// PARTNERSTWA
// ======================================================

function findInvite(text) {

    if (!text) return null;

    const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+/i;

    const match =
        text.match(regex);

    return match
        ? match[0]
        : null;
}

client.on(
    "messageCreate",
    async message => {

        if (!message.guild) return;
        if (message.author.bot) return;

        const invite =
            findInvite(
                message.content
            );

        if (!invite) return;

        console.log(
            `🤝 Wykryto invite: ${invite}`
        );

        const channel =
            message.guild.channels.cache.get(
                config.PARTNERSHIP_CHANNEL_ID
            );

        const role =
            message.guild.roles.cache.get(
                config.PARTNER_ROLE_ID
            );

        // --------------------------------------------------
        // PARTNER ROLE
        // --------------------------------------------------

        if (role) {

            const botMember =
                message.guild.members.me;

            if (
                botMember &&
                botMember.permissions.has(
                    PermissionsBitField.Flags.ManageRoles
                ) &&
                role.position <
                botMember.roles.highest.position
            ) {

                try {

                    await message.member.roles.add(
                        role,
                        "Automatyczne partnerstwo"
                    );

                } catch (error) {

                    console.log(
                        "⚠️ Nie można nadać Partner:",
                        error.message
                    );
                }
            }
        }

        if (!channel) return;

        // --------------------------------------------------
        // INVITE DATA
        // --------------------------------------------------

        let serverName =
            "Serwer partnerski";

        let members =
            "Nieznana";

        try {

            const code =
                invite
                    .replace(
                        /^https?:\/\//i,
                        ""
                    )
                    .replace(
                        /^www\./i,
                        ""
                    )
                    .replace(
                        /^discord\.gg\//i,
                        ""
                    )
                    .replace(
                        /^discord\.com\/invite\//i,
                        ""
                    );

            const inviteData =
                await client.fetchInvite(
                    code
                );

            if (inviteData.guild) {

                serverName =
                    inviteData.guild.name;

                if (
                    inviteData.memberCount
                ) {
                    members =
                        inviteData.memberCount;
                }
            }

        } catch {}

        // --------------------------------------------------
        // PARTNERSHIP EMBED
        // --------------------------------------------------

        const embed =
            createEmbed(
                message.guild,
                `${emoji(message.guild, "logo")}︲KOCiARNIA × PARTNERSTWO`,
                [
                    `${emoji(message.guild, "gwiazdki")} **Nowe partnerstwo!**`,
                    "",
                    `${emoji(message.guild, "Osoby")}︲**Partner**`,
                    `${message.author}`,
                    "",
                    `${emoji(message.guild, "ArrowPurple")}︲**Serwer**`,
                    `\`${serverName}\``,
                    "",
                    `${emoji(message.guild, "Osoby")}︲**Członkowie**`,
                    `\`${members}\``
                ].join("\n"),
                COLORS.PINK
            );

        const row =
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            "Dołącz do serwera"
                        )
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            invite.startsWith("http")
                                ? invite
                                : `https://${invite}`
                        )
                );

        try {

            await channel.send({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {

            console.error(
                "❌ Partnerstwo:",
                error.message
            );
        }
    }
);

// ======================================================
// AUTOROLE + WELCOME
// ======================================================

client.on(
    "guildMemberAdd",
    async member => {

        const role =
            member.guild.roles.cache.get(
                config.AUTOROLE_ID
            );

        if (role) {

            try {

                await member.roles.add(
                    role,
                    "Kociarnia - autorole"
                );

            } catch {}
        }

        const channel =
            member.guild.channels.cache.get(
                config.WELCOME_CHANNEL_ID
            );

        if (!channel) return;

        const embed =
            createEmbed(
                member.guild,
                `${emoji(member.guild, "Serce")}︲NOWY KOCIAK`,
                [
                    `${emoji(member.guild, "gwiazdki")} **Witamy w Kociarni!**`,
                    "",
                    `${emoji(member.guild, "Osoby")} ${member}`,
                    "",
                    `${emoji(member.guild, "ArrowPurple")} Członek numer: \`${member.guild.memberCount}\``,
                    "",
                    `${emoji(member.guild, "Serce")} Miłej zabawy!`
                ].join("\n"),
                COLORS.PINK
            );

        embed.setThumbnail(
            member.user.displayAvatarURL({
                size: 1024
            })
        );

        await channel.send({
            embeds: [embed]
        });
    }
);

// ======================================================
// GOODBYE
// ======================================================

client.on(
    "guildMemberRemove",
    async member => {

        const channel =
            member.guild.channels.cache.get(
                config.GOODBYE_CHANNEL_ID
            );

        if (!channel) return;

        await channel.send({
            embeds: [
                createEmbed(
                    member.guild,
                    `${emoji(member.guild, "nie")}︲POŻEGNANIE`,
                    [
                        `${emoji(member.guild, "gwiazdki")} **Ktoś opuścił Kociarnię.**`,
                        "",
                        `${emoji(member.guild, "Osoby")} ${member.user}`,
                        "",
                        `${emoji(member.guild, "Serce")} Mamy nadzieję, że jeszcze wrócisz!`
                    ].join("\n"),
                    COLORS.ERROR
                )
            ]
        });
    }
);

// ======================================================
// MESSAGE DELETE LOG
// ======================================================

client.on(
    "messageDelete",
    async message => {

        if (!message.guild) return;
        if (message.author?.bot) return;

        await sendLog(
            message.guild,
            createEmbed(
                message.guild,
                `${emoji(message.guild, "logo")}︲USUNIĘTA WIADOMOŚĆ`,
                [
                    `${emoji(message.guild, "Osoby")} **Autor:** ${message.author || "Nieznany"}`,
                    `${emoji(message.guild, "ArrowPurple")} **Kanał:** ${message.channel}`,
                    "",
                    `\`\`\`\n${message.content || "Brak treści"}\n\`\`\``
                ].join("\n"),
                COLORS.ERROR
            )
        );
    }
);

// ======================================================
// MESSAGE EDIT LOG
// ======================================================

client.on(
    "messageUpdate",
    async (oldMessage, newMessage) => {

        if (!oldMessage.guild) return;
        if (oldMessage.author?.bot) return;

        if (
            oldMessage.content ===
            newMessage.content
        ) {
            return;
        }

        await sendLog(
            oldMessage.guild,
            createEmbed(
                oldMessage.guild,
                `${emoji(oldMessage.guild, "logo")}︲EDYCJA WIADOMOŚCI`,
                [
                    `${emoji(oldMessage.guild, "Osoby")} **Autor:** ${oldMessage.author || "Nieznany"}`,
                    `${emoji(oldMessage.guild, "ArrowPurple")} **Kanał:** ${oldMessage.channel}`,
                    "",
                    `❌ **Przed:**\n\`\`\`\n${oldMessage.content || "Brak"}\n\`\`\``,
                    "",
                    `✅ **Po:**\n\`\`\`\n${newMessage.content || "Brak"}\n\`\`\``
                ].join("\n"),
                COLORS.WARNING
            )
        );
    }
);

// ======================================================
// BŁĘDY
// ======================================================

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "❌ Unhandled Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {
        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

// ======================================================
// LOGIN
// ======================================================

client.login(config.TOKEN);