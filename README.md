# TalkNote AI 🚀

![TalkNote AI Banner](public/talknote_banner.png) 

TalkNote AI is a modern, AI-powered note-taking application built with React and Google's Gemini API. It allows users to seamlessly capture their thoughts through voice recordings, which are then automatically transcribed into organized, editable notes. With a sleek, responsive interface, robust category management, and a powerful set of features, TalkNote AI is designed to be the only note-taking app you'll ever need.

This project was built to showcase the power of integrating advanced AI into everyday productivity tools, providing a smooth and intuitive user experience.

## ✨ Key Features

*   **🎙️ AI-Powered Voice Transcription**: Record voice notes and let the Gemini API transcribe them into text with remarkable accuracy.
*   **🧠 Smart To-Do Lists**: When recording in the "To-Do" category, the AI automatically identifies distinct tasks and formats them into an interactive checklist.
*   **🗂️ Note Organization**: Assign categories (Work, Personal, Ideas, etc.), mark notes as favorites, and easily search through your entire library.
*   **🗑️ Trash & Restore**: Never lose a note again. Deleted notes are moved to a trash folder where they can be restored or permanently deleted.
*   **🌓 Light & Dark Mode**: A beautiful, modern interface that's easy on the eyes, day or night.
*   **💾 Export & Import**: Back up all your notes to a JSON file and import them back whenever you need.
*   **⌨️ Keyboard Shortcuts**: Boost your productivity with a full suite of keyboard shortcuts for common actions.
*   **📱 Fully Responsive**: A seamless experience across all your devices, from desktop to mobile.

## 🛠️ Built With

*   **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
*   **[Google Gemini API](https://ai.google.dev/)**: For state-of-the-art voice transcription and title generation.
*   **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
*   **[Lucide React](https://lucide.dev/)**: A beautiful and consistent icon library.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and npm installed on your machine.
*   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/MercySpectures/talknote-ai.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd talknote-ai
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Add your Gemini API Key**
    *   Open the `src/App.js` file.
    *   Find the `transcribeAudio` function.
    *   Replace the placeholder `"YOUR_GEMINI_API_KEY"` with your actual API key.
    ```javascript
    const apiKey = "YOUR_GEMINI_API_KEY";
    ```
5.  **Start the development server**
    ```sh
    npm start
    ```
    Your app should now be running on [http://localhost:3000](http://localhost:3000).

## 👤 Developer

**Aman Shrivas**
*   **Email**: [huntethan144@gmail.com](mailto:huntethan144@gmail.com)
*   **LinkedIn**: [https://www.linkedin.com/in/aman-shrivas-97407014a/](https://www.linkedin.com/in/aman-shrivas-97407014a/)

---

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MercySpectures/talknote-ai/issues).
