"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function GsapScrollAnimations() {
  useGSAP(() => {
    // Basic fade up elements
    const elements = gsap.utils.toArray(".gsap-fade-up");
    elements.forEach((el: any) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Staggered lists/containers
    const staggerContainers = gsap.utils.toArray(".gsap-stagger-container");
    staggerContainers.forEach((container: any) => {
      const items = container.querySelectorAll(".gsap-stagger-item");
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });
    
    // Fade in
    const fadeElements = gsap.utils.toArray(".gsap-fade-in");
    fadeElements.forEach((el: any) => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  });

  return null;
}
