// vocs.config.ts
import { defineConfig } from "file:///Users/os/Documents/code/dojo/daydreams/docs/node_modules/vocs/_lib/index.js";
var vocs_config_default = defineConfig({
    title: "Daydreams Documentation",
    description: "Daydreams | generative agents",
    iconUrl: "/favicon-32x32.png",
    logoUrl: "/Daydreams.png",
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
            link: "/getting-started",
            items: [
                {
                    text: "Introduction",
                    link: "/getting-started/introduction",
                },
            ],
        },
        {
            text: "Overview",
            link: "/",
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
                                        },
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
export { vocs_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidm9jcy5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvb3MvRG9jdW1lbnRzL2NvZGUvZG9qby9kYXlkcmVhbXMvZG9jc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL29zL0RvY3VtZW50cy9jb2RlL2Rvam8vZGF5ZHJlYW1zL2RvY3Mvdm9jcy5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL29zL0RvY3VtZW50cy9jb2RlL2Rvam8vZGF5ZHJlYW1zL2RvY3Mvdm9jcy5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidm9jc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHRpdGxlOiBcIkRheWRyZWFtcyBEb2N1bWVudGF0aW9uXCIsXG4gICAgZGVzY3JpcHRpb246IFwiRGF5ZHJlYW1zIHwgZ2VuZXJhdGl2ZSBhZ2VudHNcIixcbiAgICBpY29uVXJsOiBcIi9mYXZpY29uLTMyeDMyLnBuZ1wiLFxuICAgIGxvZ29Vcmw6IFwiL0RheWRyZWFtcy5wbmdcIixcbiAgICBmb250OiB7XG4gICAgICAgIGdvb2dsZTogXCJJbmNvbnNvbGF0YVwiLFxuICAgIH0sXG4gICAgdGhlbWU6IHtcbiAgICAgICAgY29sb3JTY2hlbWU6IFwiZGFya1wiLFxuICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgdGV4dEFjY2VudDogXCIjYmRhNWZmXCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogXCIjMTYxNzE0XCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZERhcms6IFwiIzFjMWMxY1wiLFxuICAgICAgICAgICAgICAgIG5vdGVCYWNrZ3JvdW5kOiBcIiMxYTFhMWFcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBzaWRlYmFyOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwiR2V0dGluZyBTdGFydGVkXCIsXG4gICAgICAgICAgICBsaW5rOiBcIi9nZXR0aW5nLXN0YXJ0ZWRcIixcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkludHJvZHVjdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBsaW5rOiBcIi9nZXR0aW5nLXN0YXJ0ZWQvaW50cm9kdWN0aW9uXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwiT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIGxpbms6IFwiL1wiLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiQVBJXCIsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRleHQ6IFwiR2xvYmFsc1wiLCBsaW5rOiBcIi9hcGktcmVmZXJlbmNlL2dsb2JhbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiTmFtZXNwYWNlc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiQ2hhaW5zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcIi9hcGktcmVmZXJlbmNlL25hbWVzcGFjZXMvQ2hhaW5zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiSU9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlR3aXR0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluazogXCIvYXBpLXJlZmVyZW5jZS9uYW1lc3BhY2VzL0lPL25hbWVzcGFjZXMvVHdpdHRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlByb2Nlc3NvcnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiL2FwaS1yZWZlcmVuY2UvbmFtZXNwYWNlcy9Qcm9jZXNzb3JzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiUHJvdmlkZXJzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcIi9hcGktcmVmZXJlbmNlL25hbWVzcGFjZXMvUHJvdmlkZXJzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiVHlwZXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiL2FwaS1yZWZlcmVuY2UvbmFtZXNwYWNlcy9UeXBlc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlV0aWxzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcIi9hcGktcmVmZXJlbmNlL25hbWVzcGFjZXMvVXRpbHNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNULFNBQVMsb0JBQW9CO0FBRW5WLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLE9BQU87QUFBQSxFQUNQLGFBQWE7QUFBQSxFQUNiLFNBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULE1BQU07QUFBQSxJQUNGLFFBQVE7QUFBQSxFQUNaO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDSCxZQUFZO0FBQUEsUUFDWixZQUFZO0FBQUEsUUFDWixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNwQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTDtBQUFBLE1BQ0ksTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0g7QUFBQSxVQUNJLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxRQUNWO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxJQUNBO0FBQUEsTUFDSSxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDSDtBQUFBLFVBQ0ksTUFBTTtBQUFBLFVBQ04sT0FBTztBQUFBLFlBQ0gsRUFBRSxNQUFNLFdBQVcsTUFBTSx5QkFBeUI7QUFBQSxZQUNsRDtBQUFBLGNBQ0ksTUFBTTtBQUFBLGNBQ04sT0FBTztBQUFBLGdCQUNIO0FBQUEsa0JBQ0ksTUFBTTtBQUFBLGtCQUNOLE1BQU07QUFBQSxnQkFDVjtBQUFBLGdCQUNBO0FBQUEsa0JBQ0ksTUFBTTtBQUFBLGtCQUNOLE9BQU87QUFBQSxvQkFDSDtBQUFBLHNCQUNJLE1BQU07QUFBQSxzQkFDTixNQUFNO0FBQUEsb0JBQ1Y7QUFBQSxrQkFDSjtBQUFBLGdCQUNKO0FBQUEsZ0JBQ0E7QUFBQSxrQkFDSSxNQUFNO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGdCQUNWO0FBQUEsZ0JBQ0E7QUFBQSxrQkFDSSxNQUFNO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGdCQUNWO0FBQUEsZ0JBQ0E7QUFBQSxrQkFDSSxNQUFNO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGdCQUNWO0FBQUEsZ0JBQ0E7QUFBQSxrQkFDSSxNQUFNO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGdCQUNWO0FBQUEsY0FDSjtBQUFBLFlBQ0o7QUFBQSxVQUNKO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
