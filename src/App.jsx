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

      <section className="section" id="about">
        <div className="sectionTitle">
          <p>About Me</p>
          <h2>Not just learning engineering. Building it.</h2>
        </div>

        <div className="aboutGrid">
          <div className="glass big">
            <p>
              I am a Class 12 PCM student focused on electrical engineering,
              electronics, robotics, and product-style CAD design. I like
              building projects that move, sense, react, and actually work.
            </p>
          </div>

          <div className="glass">
            <h3>Hands-On Builder</h3>
            <p>
              ESP32, Arduino, sensors, displays, motors, wiring, debugging, and
              real prototypes.
            </p>
          </div>

          <div className="glass">
            <h3>Engineering Goal</h3>
            <p>
              I want to become a strong practical engineer who can design,
              build, test, and improve real systems.
            </p>
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