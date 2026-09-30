using Hotel.DataAccess.Repositories.InterFaces;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using static Hotel.DataAccess.Repositories.InterFaces.IGenericRepository;

namespace Hotel.DataAccess.Repositories.Class
{
    
        public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : BaseEntity, new()
        {
            // DB connection
            private readonly GymDbContext dbContext;
            private readonly DbSet<TEntity> _set;

            public GenericRepository(GymDbContext context)
            {
                dbContext = context;
                // Register Services in Program.cs
                _set = dbContext.Set<TEntity>();
            }
            public void Add(TEntity entity) => _set.Add(entity);
            public void Update(TEntity entity) => _set.Update(entity);
            public void Delete(TEntity entity) => _set.Remove(entity);
            public async Task<TEntity?> FirstOrDefaultAsync(Expression<Func<TEntity, bool>> predicate, bool tracking = false,
                                                            CancellationToken ct = default)
            {
                IQueryable<TEntity> query = tracking ? _set : _set.AsNoTracking();
                return await query.FirstOrDefaultAsync(predicate, ct);
            }
            public Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default)
                => _set.AsNoTracking().AnyAsync(predicate, ct);
            public Task<int> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken ct = default)
                => predicate is null ? _set.AsNoTracking().CountAsync(ct) : _set.AsNoTracking().CountAsync(predicate, ct);
            public async Task<IEnumerable<TEntity>> GetAllAsync(bool tracking = false, CancellationToken ct = default)
            {
                IQueryable<TEntity> query = tracking ? _set : _set.AsNoTracking();
                return await query.ToListAsync(ct);
            }
            public async Task<TEntity?> GetByIdAsync(int id, CancellationToken ct = default) => await _set.FindAsync([id], ct);
        }
    }

