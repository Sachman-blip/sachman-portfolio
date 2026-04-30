import { useState } from "react";
import "./App.css";

const projects = [
  {
    title: "ESP32 Smart Desk Display",
    type: "Embedded System",
    short:
      "OLED desk gadget with Wi-Fi setup, menus, clock, timer, and modular dashboard ideas.",
    detail:
      "A compact smart desk display using ESP32, OLED screens, buttons, rotary control, Wi-Fi setup, and a modular UI for clock, timer, weather, quotes, and future productivity modules.",
    tech: ["ESP32", "OLED", "Arduino", "C++", "Wi-Fi"],
  },
  {
    title: "6-Servo Robotic Arm",
    type: "Robotics",
    short:
      "Phone-controlled robotic arm with base, shoulder, elbow, wrist, and claw movement.",
    detail:
      "A robotic arm controlled from a phone web page. The project focuses on servo control, wiring, mechanical movement, power planning, and real hands-on robotics.",
    tech: ["ESP32", "Servo Motors", "Web UI", "Robotics", "CAD"],
  },
  {
    title: "RC Obstacle-Aware Car",
    type: "Control System",
    short:
      "ESP32 RC car with ultrasonic sensing and automatic obstacle safety behavior.",
    detail:
      "A custom RC car platform using motor drivers, ultrasonic sensors, and ESP32 control logic. Built to understand real-time sensing, movement, and safety behavior.",
    tech: ["ESP32", "Motors", "HC-SR04", "Motor Driver"],
  },
  {
    title: "CAD Product Concepts",
    type: "Design Engineering",
    short:
      "Fusion 360 designs for enclosures, stands, brackets, and 3D-printable parts.",
    detail:
      "A growing CAD portfolio with product-style enclosures, phone back designs, brackets, stands, servo mounts, and 3D-printable parts for robotics and electronics.",
    tech: ["Fusion 360", "CAD", "3D Printing", "Product Design"],
  },
];

const skills = [
  "ESP32",
  "Arduino",
  "C++",
  "Python",
  "Java",
  "Fusion 360",
  "Robotics",
  "Electronics",
  "Sensors",
  "MySQL",
  "CAD Design",
  "Problem Solving",
];

export default function App() {
  const [activeProject, setActiveProject] = useState(null);

  return (
    <div className="website">
      <nav className="navbar">
        <a href="#home" className="logo">
          <span>S</span>
          Sachman
        </a>

        <div className="navLinks">
          <a href="#about">About</a>
          <a href="#athlete">Kickboxing</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="heroGlow heroGlowOne"></div>
        <div className="heroGlow heroGlowTwo"></div>

        <div className="heroText">
          <p className="tag">Jalandhar, India · Future Electrical Engineer</p>

          <h1>
            Engineer.
            <br />
            Builder.
            <br />
            <span>Kickboxer.</span>
          </h1>

          <p className="intro">
            I build practical engineering projects using ESP32, sensors,
            robotics, CAD, and electronics. I also carry the discipline of a
            national champion kickboxer into everything I build.
          </p>

          <div className="heroButtons">
            <a href="#projects" className="primaryBtn">
              View Projects
            </a>
            <a href="#athlete" className="secondaryBtn">
              My Kickboxing Mindset
            </a>
          </div>
        </div>

        <div className="heroCard">
          <p className="cardLabel">Portfolio Identity</p>

          <h2>Electrical Engineering × Robotics × Kickboxing</h2>

          <p>
            A professional portfolio for LinkedIn, college applications,
            internships, and future engineering opportunities.
          </p>

          <div className="terminalBox">
            <p>
              <span className="green">●</span> loading_builder_profile...
            </p>
            <p>
              <span className="blue">●</span> projects: ESP32, CAD, robotics
            </p>
            <p>
              <span className="red">●</span> discipline: kickboxing mindset
            </p>
          </div>
        </div>
      </section>

      <section className="section aboutLongSection" id="about">
        <div className="sectionTitle">
          <p>About Me</p>
          <h2>Curious by nature. Disciplined by sport. Driven by engineering.</h2>
        </div>

        <div className="aboutLongGrid">
          <div className="aboutLongMain">
            <h3>Hi, I’m Sachman Singh.</h3>

            <p>
              I was born and raised in Jalandhar, Punjab, and I have always
              been curious about the world around me. I like understanding how
              things work, why they work, and how I can make them better.
            </p>

            <p>
              My real curiosity to learn and build became stronger after my
              Class 12 board exams ended. As soon as I had the time, I started
              working on my interests seriously — electronics, robotics, CAD
              design, hardware, software, and practical engineering projects.
            </p>

            <p>
              My interest in electronics started when I saw cool technology and
              my brain immediately began thinking of ideas. Instead of only
              imagining them, I decided to act on them. I started building
              projects using ESP32, Arduino, sensors, motors, displays, and
              custom wiring.
            </p>

            <p>
              I also developed a strong interest in CAD design. I enjoy
              designing parts, enclosures, stands, brackets, and product
              concepts. My goal is to take some of my ideas beyond prototypes
              and eventually make them commercial products.
            </p>

            <p>
              I am learning to build the full system myself — hardware,
              software, and CAD design. That is what excites me the most:
              taking an idea from my mind and turning it into something real.
            </p>
          </div>

          <div className="aboutSideStack">
            <div className="aboutMiniCard">
              <h3>Engineering Mindset</h3>
              <p>
                I like practical building. My focus is not only theory — I want
                to design, test, debug, improve, and create real working
                systems.
              </p>
            </div>

            <div className="aboutMiniCard">
              <h3>Athlete Lifestyle</h3>
              <p>
                I have been training kickboxing since the age of 12. I run,
                box, wrestle, and love staying physically fit. Training gives
                me discipline, confidence, and mental toughness.
              </p>
            </div>

            <div className="aboutMiniCard">
              <h3>Future Goal</h3>
              <p>
                My future goal is simple: keep learning. I am curious about
                everything, and I want to become the kind of engineer who can
                build useful, creative, and powerful technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section athleteSection" id="athlete">
        <div className="sectionTitle">
          <p>Kickboxing</p>
          <h2>Fighting shaped the way I build.</h2>
        </div>

        <div className="athleteGrid">
          <div className="athleteMain">
            <p className="athleteTag">National Champion Mindset</p>

            <h3>
              Kickboxing is not just a sport for me. It is one of the biggest
              parts of who I am.
            </h3>

            <p>
              Training taught me discipline, pressure control, confidence,
              consistency, pain tolerance, and the ability to keep improving
              even when things get difficult. I bring the same mindset into
              engineering, robotics, CAD, and every project I build.
            </p>
          </div>

          <div className="athleteCard">
            <h3>Discipline</h3>
            <p>Showing up every day, even when motivation is low.</p>
          </div>

          <div className="athleteCard">
            <h3>Pressure Handling</h3>
            <p>Staying calm, focused, and sharp when things get intense.</p>
          </div>

          <div className="athleteCard">
            <h3>Builder Mentality</h3>
            <p>
              Train. Fail. Fix. Repeat. The same loop works in fighting and
              engineering.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="projects">
        <div className="sectionTitle">
          <p>Projects</p>
          <h2>Featured engineering builds</h2>
        </div>

        <div className="projectGrid">
          {projects.map((project) => (
            <button
              className="projectCard"
              key={project.title}
              onClick={() => setActiveProject(project)}
            >
              <p className="projectType">{project.type}</p>
              <h3>{project.title}</h3>
              <p className="projectShort">{project.short}</p>
              <div className="clickText">Click to open popup →</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="skills">
        <div className="sectionTitle">
          <p>Skills</p>
          <h2>Tools I use to build</h2>
        </div>

        <div className="skills">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contactCard">
          <h2>Let’s build something real.</h2>

          <p>
            Reach out to me for engineering projects, collaborations, portfolio
            work, or future opportunities.
          </p>

          <div className="contactButtons">
            <a href="mailto:sachman.singh.saund@gmail.com">Email</a>

            <a
              href="https://www.linkedin.com/in/sachman-singh-30324738a/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>

            <a
              href="https://www.instagram.com/sachman.singh/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      <footer>Built by Sachman Singh Sond · Engineering Portfolio</footer>

      {activeProject && (
        <div className="modalBg" onClick={() => setActiveProject(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="closeModal"
              onClick={() => setActiveProject(null)}
            >
              ×
            </button>

            <p className="modalType">{activeProject.type}</p>
            <h2>{activeProject.title}</h2>
            <p>{activeProject.detail}</p>

            <div className="techList">
              {activeProject.tech.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}