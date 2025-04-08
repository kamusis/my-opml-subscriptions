---
title: 'From Software Search to Code Generation: The Agentic Coding Revolution'
date: 2025-04-08 15:20:11+09:00
tags: [Deno, JavaScript, TypeScript, Agentic Coding, AI]
---

## User Story: RSS Feed Clean-up Journey

Over the past 15 years, I've accumulated a substantial collection of RSS feeds, numbering over 200 subscriptions. While RSS usage has dramatically declined in recent years, some of these feeds remain part of my daily reading routine. However, the collection has become cluttered:

- Many feeds have become completely inaccessible
- Some bloggers have stopped updating their sites
- Certain feeds are still active but rarely updated

**The Challenge:**
- Manual verification of each feed would be tedious and time-consuming
- My RSS reader (News Explorer) lacks feed cleanup functionality
- Alternative solutions like Inoreader require paid subscriptions
- The task remained pending due to lack of efficient solutions

**The Agentic Coding Solution:**
What was previously a daunting task transformed into a manageable project:
- Total time from requirement writing to completion: ~2 hours
- Automated validation of all feeds
- Generated comprehensive statistics and visualizations
- Successfully categorized feeds into active, inactive, and dead
- Pleasant and efficient development experience

This experience perfectly illustrates how agentic coding can turn a long-postponed task into an achievable solution through clear requirement description and AI-assisted development.

## The Traditional Approach
Traditionally, when faced with a specific requirement like validating and analyzing OPML feed subscriptions, the typical workflow would be:

1. Search for existing software that might solve the problem
2. Evaluate multiple tools and their features
3. Choose the closest match, often compromising on exact requirements
4. Learn how to use the chosen software
5. Deal with limitations and missing features

This process is time-consuming and often results in settling for a solution that doesn't perfectly match our needs.

## The Agentic Coding Paradigm
With agentic coding, the approach transforms dramatically:

1. Clearly describe your requirements in natural language
2. Let AI understand and break down the problem
3. Generate custom code that exactly matches your needs
4. Iterate and refine the solution through conversation

### Real-World Example: OPML Feed Validator
This project demonstrates the power of agentic coding. Instead of searching for an existing OPML feed validator:

- We described our need for a tool that could:
  - Validate RSS feeds in an OPML file
  - Check feed accessibility
  - Analyze update frequencies
  - Generate meaningful statistics
  - Visualize the results

- The AI agent:
  - Designed the system architecture
  - Implemented the required functionality
  - Created visualization components
  - Generated comprehensive documentation
  - All while following best practices and proper error handling

## Benefits of Agentic Coding

1. **Perfect Fit**: Solutions are tailored exactly to your requirements
2. **Rapid Development**: No need to spend time searching and evaluating existing tools
3. **Full Control**: Complete access to the source code for modifications
4. **Learning Opportunity**: Understanding how the solution works through generated code
5. **Cost-Effective**: No need to purchase or subscribe to multiple tools
6. **Maintenance Freedom**: Ability to modify and extend the solution as needs evolve

## Future Implications
This shift from "finding" to "generating" solutions represents a fundamental change in how we approach software development. As AI continues to evolve:

- Development will become more requirement-driven than tool-driven
- Custom solutions will become as accessible as off-the-shelf software
- The focus will shift from "what exists" to "what's possible"

Agentic coding empowers developers and users alike to create exactly what they need, breaking free from the limitations of existing software solutions.

## Lessons Learned and Experience

### 1. The Importance of Clear Requirements

Product thinking and clear requirements are crucial for successful AI-assisted development:

- **Clear Vision Leads to Better Code**: When requirements are well-defined and specific about how the tool should behave, the AI generates higher quality code
- **Product Mindset**: Requirement providers need to have a clear understanding of:
  - Desired user interactions
  - Expected outputs and their formats
  - Error handling scenarios
  - Performance expectations
- **Iterative Refinement**: Unclear requirements often lead to multiple iterations and code quality issues

### 2. Technology Stack Selection Matters

The choice of programming languages and libraries significantly impacts AI-assisted development success:

- **Language Popularity Impact**:
  - More widely used languages (like Python) often result in better AI-generated code
  - Popular languages have more training data and real-world examples
  - In this project, while we chose TypeScript with Deno for learning purposes, Python might have been an easier choice

- **Library Selection Strategy**:
  - Popular, widely-used libraries lead to better AI comprehension and implementation
  - Example from this project:
    - Initial attempt: Using less common `deno_chart` library resulted in multiple errors
    - Successful pivot: Switching to standard SVG generation led to immediate success
  - Lesson: Prefer mainstream libraries over niche ones when working with AI

### Best Practices for AI-Assisted Development

1. **Requirements Phase**:
   - Invest time in detailed requirement documentation
   - Include specific examples of desired behavior
   - Define clear success criteria

2. **Technology Selection**:
   - Consider language popularity and ecosystem maturity
   - Choose widely-adopted libraries when possible
   - Balance learning goals with development efficiency

3. **Development Process**:
   - Start with core functionality using proven technologies
   - Experiment with newer technologies only after basic features are stable
   - Be prepared to pivot when encountering AI limitations with specific technologies

This project serves as a practical example of these lessons, demonstrating both the potential and limitations of AI-assisted development while highlighting the importance of making informed technology choices.

The project can be found [here](https://github.com/kamusis/my-opml-subscriptions).

