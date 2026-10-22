
import React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import "@empire/ui/ui.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@empire/ui/adapters/maplibre.css";
import "@empire/ui/command-center.css";
const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--eol-color-background").trim();
if (themeColor) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", themeColor);
const el=document.getElementById("root");
if(!el)throw new Error("Missing app root");
createRoot(el).render(<React.StrictMode><App/></React.StrictMode>);
