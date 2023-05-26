# django-openai

Django-OpenAI is an open-source chat application that integrates with OpenAI's GPT-3.5-Turbo, featuring real-time streaming and a sleek, user-friendly interface. Designed with simplicity and extensibility in mind, it's easy to set up and customizable to your needs.

![Screenshot of Django-OpenAI](https://i.ibb.co/7zfCg2p/Django-Open-AI.png)

## Features

- Real-time streaming with GPT-3.5-Turbo
- Easy integration with the OpenAI API
- Modern, intuitive, and customizable UI/UX
- Built on Django for robustness and extensibility
- Supports multiple simultaneous chat instances

## Getting Started

### Prerequisites

- Python 3.7+
- Django 3.2+
- An OpenAI API Key (obtainable from [OpenAI](https://www.openai.com/))

### Installation

1. Clone this repository:

    ```shell
    git clone https://github.com/YourUsername/django-openai.git
    ```

2. Install the dependencies:

    ```shell
    pip install -r requirements.txt
    ```

3. Create a `.env` file in the root directory and add your OpenAI API key:

    ```shell
    OPENAI_API_KEY=<your-api-key>
    ```

4. Run the Django server:

    ```shell
    python manage.py runserver
    ```

The application should now be running on `localhost:8000`.

## Usage

To start a chat session, go to `localhost:8000/start-chat`.

To view an existing chat session, go to `localhost:8000/chat/<chat-id>`.

## Contributing

We welcome contributions from the community!

## License

This project is licensed under the terms of the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- OpenAI for their fantastic work in the field of artificial intelligence.

## Contact

If you have any questions, feel free to reach out to us.

- Your Name
- Your Email
- Project Link: https://github.com/brainsstorm/django-openai
