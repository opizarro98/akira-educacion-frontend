import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { ApiActivityService } from '../services/api-activity.service';

export const activityInterceptor: HttpInterceptorFn = (request, next) => {
    const activity = inject(ApiActivityService);
    activity.begin();
    return next(request).pipe(finalize(() => activity.end()));
};
