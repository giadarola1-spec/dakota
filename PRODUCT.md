# Product Truth: Dakota

## Overview
**Dakota** is a specialized, privacy-first web utility for freight dispatchers, carrier operators, and logistics managers. It parses transportation rate confirmations (PDFs, images, and text) to instantly extract load parameters, schedule stops, and generate standardized dispatch email chains and operational notes.

## Platform
- **Target**: Web (Responsive, desktop-optimized for logistics multi-monitor setups)
- **Architecture**: 100% Client-side local execution (Zero remote storage or transmission of sensitive freight rates, shipper data, or driver assignments)

## Users & Job to be Done
- **Primary Users**: Freight dispatchers, carrier fleet managers, freight brokers, and owner-operators.
- **Situation**: Handling dozens of time-sensitive rate confirmations daily from major freight brokerages (e.g., C.H. Robinson, TQL, Coyote, Landstar).
- **Core Job**: Eliminate manual typing and copy-paste errors when converting carrier rate confirmation documents into dispatch chains, load notes, and driver assignments.

## Key Capabilities & Workflows
1. **Document Intake**: Drag-and-drop or file upload for Rate Confirmation PDFs, with interactive visual text selection and OCR fallback.
2. **Deterministic & AI Extraction**: Intelligent parsing of Origin, Destination, intermediate stops, pickup/delivery appointment windows, load numbers, rates, and equipment types.
3. **Dispatch Chain Generation**: Live template engine with customizable tokenized chain formats (e.g., `{unit}-{orig_st}-{dest_st}-{date} {broker} LOAD {load_num}`).
4. **Operations Notes Generator**: Standardized clipboard-ready dispatch notes for TMS entries, driver communications, and tracking updates.
5. **Privacy Assurance**: All document parsing and text layers remain local to the user's browser memory.

## Durable Constraints & Guarantees
- **Local Execution**: No customer rate confirmations or shipment records sent to third-party servers.
- **Speed & Precision**: One-click copying with immediate visual feedback.
- **Deterministic Fallbacks**: Every field is editable with manual override and live preview synchronization.
