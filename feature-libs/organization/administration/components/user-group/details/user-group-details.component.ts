import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserGroup } from '@spartacus/organization/administration/core';
import { Observable } from 'rxjs';
import { shareReplay, startWith, switchMap } from 'rxjs/operators';
import { ItemService } from '../../shared/item.service';
import { UserGroupItemService } from '../services/user-group-item.service';

@Component({
  selector: 'cx-org-user-group-details',
  templateUrl: './user-group-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ItemService,
      useExisting: UserGroupItemService,
    },
  ],
  host: { class: 'content-wrapper' },
})
export class UserGroupDetailsComponent {
  model$: Observable<UserGroup> = this.itemService.key$.pipe(
    switchMap((code) => this.itemService.load(code)),
    shareReplay({ bufferSize: 1, refCount: true }),
    startWith({})
  );
  isInEditMode$ = this.itemService.isInEditMode$;

  constructor(protected itemService: ItemService<UserGroup>) {}
}
