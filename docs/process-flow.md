# OPML Feed Validator Process Flow

```mermaid
graph TB
    A[Start] --> B[Parse Command Line Args]
    B --> C[Parse OPML File]
    C --> D[Process Feeds]
    
    subgraph "Feed Processing"
        D --> E[Check Feed Accessibility]
        E -->|Accessible| F[Check Feed Compatibility]
        E -->|Not Accessible| G[Mark as Dead]
        F -->|Compatible| H[Check Update Frequency]
        F -->|Not Compatible| I[Mark as Incompatible]
        H -->|Active| J[Mark as Active]
        H -->|Inactive| K[Mark as Inactive]
    end
    
    G --> L[Generate New OPML Files]
    I --> L
    J --> L
    K --> L
    
    L --> M[Generate Statistics]
    M --> N[End]
    
    style A fill:#98fb98
    style N fill:#ff9999
    style D fill:#87CEFA
```

This diagram illustrates the main process flow of the OPML feed validator and analyzer, showing how feeds are processed, validated, and categorized before generating the final output files.
