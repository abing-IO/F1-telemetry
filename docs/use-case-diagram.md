# F1 Telemetry Hub Use Case Diagram

This version is formatted for academic documentation and report writing.

```mermaid
usecaseDiagram
    actor User as "User"
    actor Jolpica as "Jolpica API"
    actor FastF1 as "FastF1 Service"
    actor Gemini as "Gemini AI Service"

    rectangle "F1 Telemetry Hub" {
        (Access Dashboard Views) as UC13
        (View Championship Standings) as UC1
        (View Season Progression) as UC2
        (Select Race Comparison Parameters) as UC4
        (Retrieve Telemetry Data) as UC3
        (Compare Driver Performance) as UC5
        (View Lap and Race Results) as UC6
        (Export Visual Reports) as UC7
        (Perform Tire Degradation Analysis) as UC8
        (Perform Weather Impact Analysis) as UC9
        (Perform Overtaking Analysis) as UC10
        (Generate AI-Based Insights) as UC11
        (Switch Display Theme) as UC12
    }

    User --> UC13
    User --> UC1
    User --> UC2
    User --> UC4
    User --> UC3
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12

    UC3 ..> UC4 : <<include>>
    UC5 ..> UC3 : <<include>>
    UC6 ..> UC3 : <<include>>
    UC11 ..> UC5 : <<extend>>
    UC11 ..> UC8 : <<extend>>
    UC11 ..> UC9 : <<extend>>
    UC11 ..> UC10 : <<extend>>

    Jolpica --> UC1
    Jolpica --> UC2
    FastF1 --> UC3
    FastF1 --> UC8
    FastF1 --> UC9
    FastF1 --> UC10
    Gemini --> UC11
```

## Report Description

The use case diagram for the F1 Telemetry Hub illustrates how a user interacts with the system to access Formula 1 analytics and reporting features. The primary actor is the `User`, who can navigate dashboard views, inspect championship standings, review season progression, retrieve telemetry data, compare driver performance, analyze race-related factors, export reports, and request AI-generated insights.

The system also interacts with three external service actors. The `Jolpica API` supplies championship standings and season progression data. The `FastF1 Service` provides telemetry, lap-level, weather, and overtaking data used in advanced race analysis. The `Gemini AI Service` supports the generation of natural-language insights based on processed telemetry and analytical outputs.

The relationships shown in the diagram indicate that retrieving telemetry data includes the selection of race comparison parameters such as year, Grand Prix, session type, drivers, and lap number. In addition, AI-based insight generation extends the driver comparison, tire degradation, weather impact, and overtaking analysis use cases, since these insights are only available after the corresponding analytical data has been generated.

## Actors

- `User`: the primary actor who interacts with the dashboard and analysis features.
- `Jolpica API`: external data provider for standings and season progression.
- `FastF1 Service`: external provider of telemetry and race analytics data.
- `Gemini AI Service`: external AI service for explanatory insights.

## Notes

- `Retrieve Telemetry Data` requires the user to define year, Grand Prix, session type, drivers, and optionally a lap number.
- `Export Visual Reports` includes chart export and PDF report generation.
- `Generate AI-Based Insights` is dependent on the availability of processed telemetry or analytical results.

## Source Mapping

- Frontend views: [src/App.jsx](/run/media/abing/Gaming/projects/f1-telemetry/src/App.jsx)
- Standings and season progression: [src/components/Standings.jsx](/run/media/abing/Gaming/projects/f1-telemetry/src/components/Standings.jsx)
- Race telemetry, comparisons, and export: [src/components/RaceData.jsx](/run/media/abing/Gaming/projects/f1-telemetry/src/components/RaceData.jsx)
- Analysis tools and AI trigger: [src/components/Analysis.jsx](/run/media/abing/Gaming/projects/f1-telemetry/src/components/Analysis.jsx), [src/components/InsightPanel.jsx](/run/media/abing/Gaming/projects/f1-telemetry/src/components/InsightPanel.jsx)
- Backend endpoints: [backend/server.py](/run/media/abing/Gaming/projects/f1-telemetry/backend/server.py)
