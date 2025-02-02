import { defineConfig } from "vocs";

export default defineConfig({
    banner: "Head to our new [Discord](https://discord.gg/rt8ajxQvXh)!",
    title: "Daydreams Documentation",
    description: "Daydreams | generative agents",
    iconUrl: "/favicon-32x32.png",
    logoUrl: "/Daydreams.png",
    topNav: [
        { text: "Site", link: "https://dreams.fun" },
        {
            text: "Releases",
            link: "https://github.com/daydreamsai/daydreams/releases",
        },
    ],
    socials: [
        {
            icon: "github",
            link: "https://github.com/daydreamsai/daydreams",
        },
        {
            icon: "x",
            link: "https://x.com/daydreamsagents",
        },
    ],
    editLink: {
        pattern:
            "https://github.com/daydreamsai/daydreams/tree/main/docs/pages/:path",
        text: "Edit on GitHub",
    },
    font: {
        google: "Inconsolata",
    },
    theme: {
        colorScheme: "dark",
        variables: {
            color: {
                textAccent: "#bda5ff",
                background: "#161714",
                backgroundDark: "#1c1c1c",
                noteBackground: "#1a1a1a",
            },
        },
    },
    sidebar: [
        {
            text: "Getting Started",
            items: [
                {
                    text: "Introduction",
                    link: "/",
                },
            ],
        },
        {
            text: "Overview",
            items: [
                {
                    text: "API",
                    items: [
                        { text: "Globals", link: "/api-reference/globals" },
                        {
                            text: "Namespaces",
                            items: [
                                {
                                    text: "Chains",
                                    link: "/api-reference/namespaces/Chains",
                                },
                                {
                                    text: "IO",
                                    items: [
                                        {
                                            text: "Twitter",
                                            link: "/api-reference/namespaces/IO/namespaces/Twitter",
                                        },
                                        {
                                            text: "Discord",
                                            link: "/api-reference/namespaces/IO/namespaces/Discord",
                                        }
                                    ],
                                },
                                {
                                    text: "Processors",
                                    link: "/api-reference/namespaces/Processors",
                                },
                                {
                                    text: "Providers",
                                    link: "/api-reference/namespaces/Providers",
                                },
                                {
                                    text: "Types",
                                    link: "/api-reference/namespaces/Types",
                                },
                                {
                                    text: "Utils",
                                    link: "/api-reference/namespaces/Utils",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
});
