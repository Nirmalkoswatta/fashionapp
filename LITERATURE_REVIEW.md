# LITERATURE REVIEW: FASHION GIRL E-COMMERCE PLATFORM

## 1. Introduction
The **Fashion Girl** platform is an innovative e-commerce application designed to match fashion customers with custom tailoring vendors. Unlike traditional e-commerce platforms that sell mass-produced, standard-sized clothing, **Fashion Girl** uses advanced technologies—such as image processing, text mining, and multimodal recommendation systems—to connect users with designers who can create custom-fit apparel. 

This document reviews the existing literature on the key technologies used in the platform, including the new forward-thinking features: offline AI chatbots, secure centralized payments, and interactive tailoring user interfaces.

---

## 2. Image Processing and Vision in Fashion Matching
Image processing plays a critical role in modern fashion systems. It allows platforms to analyze the visual features of clothing, such as color, pattern, and style.
* **Feature Extraction**: Convolutional Neural Networks (CNNs) are widely used to extract key visual attributes from fashion images uploaded by users.
* **Style Recognition**: Computers can recognize different style categories (e.g., casual, formal, vintage) by analyzing visual details like collar shapes and sleeve lengths.
* **Multimodal Matching**: Visual representation is combined with text search to help users find clothes that look similar to their reference images.

---

## 3. Text Mining and Natural Language Processing (NLP) in E-Commerce
Text mining helps the platform understand written search queries, user reviews, and product descriptions.
* **Keyword Matching**: Basic search engines look for specific keywords. Advanced NLP models understand the meaning behind user queries, such as "breathable summer dress".
* **Entity Extraction**: NLP tools extract key information like fabric type, size preference, and occasion from unstructured text descriptions.
* **Sentiment Analysis**: Understanding reviews helps rank vendors based on customer satisfaction.

---

## 4. Multimodal Recommendation Systems
Multimodal recommendation systems combine different types of data (like images and text) to make better recommendations.
* **Cross-Modal Retrieval**: Users can search for a custom vendor using both an image (e.g., a photo of a dress) and text instructions (e.g., "make this in cotton, blue color").
* **Collaborative Filtering**: Recommends items based on what other users with similar tastes have liked.
* **Hybrid Approaches**: Combining visual data with text mining overcomes the "cold-start problem," where new vendors or items have no previous review data.

---

## 5. AI Chatbots in E-Commerce
AI chatbots are computer programs that talk to users to help them shop, answer questions, and solve problems.
* **Offline and Local LLMs (Large Language Models)**: Traditionally, chatbots connect to cloud-based APIs (like OpenAI's GPT). However, running a local model like **mistral-nemo** using **Ollama** offers significant advantages:
  * **Data Privacy**: Customer measurements, chat histories, and design preferences are processed locally. No private data is sent to external servers.
  * **No API Fees**: Local models run on the server's own hardware, which means the platform does not pay per-query fees to external providers.
  * **Reliability**: The chatbot remains fully functional even without an internet connection to third-party services.
* **Vendor Assistance**: Chatbots help vendors draft replies to customer inquiries, generate description templates for custom clothing designs, and manage custom orders.
* **Customer Support**: Chatbots assist customers in navigating the platform, selecting styles, and troubleshooting issues.

---

## 6. Secure Payment Gateways
A secure and centralized payment system is crucial for custom e-commerce platforms where products are made-to-order.
* **Centralized Transactions**: Instead of customers paying vendors directly through private bank transfers (which is risky), all money flows through the platform's secure payment gateway.
* **Escrow-Like Protection**: The platform holds the payment until the vendor completes the custom clothing and the customer approves the order. This builds trust between both parties.
* **Commission and Revenue Model**: Centralized payments allow the platform to automatically deduct a percentage (commission) from each successful transaction before releasing the remaining funds to the vendor. This ensures a reliable stream of profit to maintain the platform.
* **Fraud Prevention**: Centralized billing helps detect suspicious activities and simplifies refund processing.

---

## 7. Interactive User Interfaces (UI) for Custom Tailoring
Custom clothing requires precise body measurements. Standard online forms with text input boxes often lead to errors because users do not know how to measure themselves correctly.
* **Visual Sizing UI**: Using an interactive clothing sketch with visual markers (e.g., A, B, C or 1, 2, 3) significantly improves accuracy:
  * **Marker 1 (Chest)**: Guides the user to measure around the widest part of their chest.
  * **Marker 2 (Waist)**: Highlights the narrowest part of the torso.
  * **Marker 3 (Hips)**: Shows where to measure around the hips.
  * **Visual Guides**: When a user clicks a marker, the UI displays a clear explanation or a small animation showing how to take that measurement.
* **Material Selector**: A simple checklist/tick-box system lets users choose their preferred fabrics (e.g., cotton, silk, linen) and materials. This structured input avoids confusion and ensures vendors receive clear specifications.

---

## 8. Research Gap
While existing literature covers general fashion recommendations and cloud-based chatbots, there are several key gaps that the **Fashion Girl** platform addresses:
1. **Lack of Local AI Support**: Most e-commerce systems rely on expensive, cloud-based LLM APIs, raising privacy concerns and increasing running costs. There is limited research on running localized models like `mistral-nemo` via Ollama for custom fashion.
2. **Standard Sizing Failure**: Standard retail platforms only support off-the-rack sizing (S, M, L). Custom-tailored platforms lack interactive, user-friendly visual measurement guides, leading to poor customer inputs.
3. **Vendor-Customer Payment Risks**: Traditional peer-to-peer custom marketplaces often leave transactions to direct communication, leading to payment fraud. There is a lack of research on integrated commission-based escrow systems designed specifically for custom fashion workflows.

---

## 9. Summary
The **Fashion Girl** platform addresses these research gaps by integrating visual search (image processing), text mining, local AI assistant models (Ollama/mistral-nemo), secure escrow-style payments with a built-in commission system, and interactive measurement forms. This combined architecture ensures a highly personalized, secure, and accurate custom tailoring experience.
