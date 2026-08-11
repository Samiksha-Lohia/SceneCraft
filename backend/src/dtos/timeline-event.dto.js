export class TimelineEventDto {
  constructor(event) {
    this.id = event._id || event.id;
    this.documentId = event.documentId;
    this.sceneId = event.sceneId;
    this.chronologicalOrder = event.chronologicalOrder;
    this.timeLabel = event.timeLabel || '';
    this.isFlashback = event.isFlashback || false;
    this.createdAt = event.createdAt;
    this.updatedAt = event.updatedAt;
  }

  static toResponse(event) {
    if (!event) return null;
    return new TimelineEventDto(event);
  }

  static toResponseList(events) {
    if (!Array.isArray(events)) return [];
    return events.map(event => new TimelineEventDto(event));
  }
}
